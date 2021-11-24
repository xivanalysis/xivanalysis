import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink, DataLink} from 'components/ui/DbLink'
import JobIcon from 'components/ui/JobIcon'
import {getDataBy} from 'data'
import {Action} from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import {Event, Events} from 'event'
import {ActorType} from 'fflogs'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {Button, Table} from 'semantic-ui-react'
import {PLAY} from '../ArcanaGroups'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import styles from './ArcanaSuggestions.module.css'
import ArcanaTracking, {CardState, SealType, SleeveType} from './ArcanaTracking'
import sealCelestial from './seal_celestial.png'
import sealLunar from './seal_lunar.png'
import sealSolar from './seal_solar.png'

const TIMELINE_UPPER_MOD = 30000 // in ms

// set-up for divination players hit tracking
const PLAYERS_HIT_TARGET = 8

class DivinationWindow {
	start: number
	end?: number

	rotation: Array<Events['action']> = []
	gcdCount: number = 0
	trailingGcdEvent?: Events['action']

	buffsRemoved: number[] = []
	playersBuffed: string[] = []
	containsOtherAST: boolean = false

	constructor(start: number) {
		this.start = start
	}
}
//end set-up for divination

const SEAL_ICON = {
	[SealType.NOTHING]: '',
	[SealType.SOLAR]: sealSolar,
	[SealType.LUNAR]: sealLunar,
	[SealType.CELESTIAL]: sealCelestial,
}

interface SleeveIcon {
	[key: number]: string
}

interface CardLog extends CardState {
	targetName: string | null
	targetJob: string | null
}

export default class ArcanaSuggestions extends Analyser {
	static override handle = 'arcanaSuggestions'

	static override title = t('ast.arcana-suggestions.title')`Arcana Logs`
	static override displayOrder = DISPLAY_ORDER.ARCANA_TRACKING

	@dependency private data!: Data
	@dependency private arcanaTracking!: ArcanaTracking
	@dependency private timeline!: Timeline
	@dependency private actors!: Actors

	private cardLogs: CardLog[] = []
	private play: Array<Action['id']> = []
	private sleeveIcon: SleeveIcon = {}

	//div privates for output
	private history: DivinationWindow[] = []
	private divinationCast: number = 0
	//end div privates

	override initialise() {
		this.play = PLAY.map(actionKey => this.data.actions[actionKey].id)

		this.sleeveIcon = {
			[SleeveType.NOTHING]: '',
			[SleeveType.ONE_STACK]: this.data.statuses.SLEEVE_DRAW.icon,
			[SleeveType.TWO_STACK]: 'https://xivapi.com/i/019000/019562.png',
		}

		//used for divination tracking
		const divinationFilter = filter<Event>().type('statusApply').status(this.data.statuses.DIVINATION.id)
		this.addEventHook(divinationFilter.target(this.parser.actor.id), this.tryOpenWindow)
		this.addEventHook(divinationFilter.source(this.parser.actor.id), this.countDivinationBuffs)
		this.addEventHook(
			filter<Event>()
				.type('statusRemove')
				.target(this.parser.actor.id)
				.status(this.data.statuses.DIVINATION.id),
			this.tryCloseWindow,
		)
		this.addEventHook(filter<Event>().type('action').source(this.parser.actor.id), this.onCast)

		this.addEventHook('complete', this._onComplete)
	}

	//functions for divination buff counting
	private countDivinationBuffs(event: Events['statusApply']) {
		// Get this from tryOpenWindow. If a window wasn't open, we'll open one.
		// If it was already open (because another Astrologian went first), we'll keep using it
		const lastWindow: DivinationWindow = this.tryOpenWindow(event)

		// Find out how many players we hit with the buff.
		if (!lastWindow.playersBuffed.includes(event.target) && this.actors.get(event.target).playerControlled) {
			lastWindow.playersBuffed.push(event.target)
		}
	}

	private tryOpenWindow(event: Events['statusApply']): DivinationWindow {
		const lastWindow: DivinationWindow | undefined = _.last(this.history)

		// Handle multiple Astrologian's buffs overwriting each other, we'll have a remove then an apply with the same timestamp
		// If that happens, re-open the last window and keep tracking
		if (lastWindow != null) {
			if (event.source !== this.parser.actor.id) {
				lastWindow.containsOtherAST = true
			}
			if (lastWindow.end == null) {
				return lastWindow
			}
			if (lastWindow.end === event.timestamp) {
				lastWindow.end = undefined
				return lastWindow
			}
		}

		const newWindow = new DivinationWindow(event.timestamp)
		this.history.push(newWindow)
		return newWindow
	}

	private tryCloseWindow(event: Events['statusRemove']) {
		const lastWindow: DivinationWindow | undefined = _.last(this.history)

		if (lastWindow == null) {
			return
		}

		// Cache whether we've seen a buff removal event for this status, just in case they happen at exactly the same timestamp
		lastWindow.buffsRemoved.push(event.status)

		if (this.isWindowOkToClose(lastWindow)) {
			lastWindow.end = event.timestamp
		}
	}

	// Make sure all applicable statuses have fallen off before the window closes
	private isWindowOkToClose(window: DivinationWindow): boolean {
		if (!window.buffsRemoved.includes(this.data.statuses.DIVINATION.id)) {
			return false
		}
		return true
	}

	private onCast(event: Events['action']) {
		const lastWindow: DivinationWindow | undefined = _.last(this.history)

		// If we don't have a window, bail
		if (lastWindow == null) {
			return
		}

		const action = this.data.getAction(event.action)

		// Can't do anything else if we didn't get a valid action object
		if (action == null) {
			return
		}

		// If this window isn't done yet add the action to the list
		if (lastWindow.end == null) {
			lastWindow.rotation.push(event)
			if (action.onGcd != null) {
				lastWindow.gcdCount++
			}
			if (event.action === this.data.actions.DIVINATION.id || lastWindow.playersBuffed.length < 1) {
				lastWindow.containsOtherAST = true
			}
			return
		}

		// If we haven't recorded a trailing GCD event for this closed window, do so now
		if (lastWindow.end != null && lastWindow.trailingGcdEvent == null && action.onGcd) {
			lastWindow.trailingGcdEvent = event
		}
	}
	//end divination functions

	private _onComplete() {
		this.cardLogs = this.arcanaTracking.cardLogs.map(artifact => {

			const targetId = artifact.lastEvent.type === 'action'
				? artifact.lastEvent.target
				: undefined
			const target = artifact.lastEvent.type === 'action' && targetId != null ? this.actors.get(targetId) : undefined

			const cardLog: CardLog = {
				...artifact,
				targetName: target != null ? target.name : null,
				targetJob: target != null ? target.job
					: null,
			}
			return cardLog
		})
	}

	override output() {
		return <>
			<p>
				<Trans id="ast.arcana-suggestions.messages.explanation">
				This section keeps track of every card action made during the fight, and the state of the spread after each action.
				</Trans>
			</p>
			<p>
				<Trans id="ast.arcana-suggestions.messages.footnote">
				* No pre-pull actions are being represented aside from <DataLink action="PLAY" />, and this is only an approximation based on the buff duration.
				</Trans>
			</p>
			<Table collapsing unstackable className={styles.cardActionTable}>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell width={1}>
							<Trans id="ast.arcana-suggestions.messages.time">
											Time
							</Trans>
						</Table.HeaderCell>
						<Table.HeaderCell width={1}>
							<Trans id="ast.arcana-suggestions.messages.latest-action">Lastest Action</Trans>
						</Table.HeaderCell>
						<Table.HeaderCell width={2}>
							<Trans id="ast.arcana-suggestions.messages.target">Target</Trans>
						</Table.HeaderCell>
						<Table.HeaderCell width={2}>
							<Trans id="ast.arcana-suggestions.messages.spread-state">Spread State</Trans>
						</Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{this.cardLogs.map(artifact => {
						if (artifact.lastEvent.type === 'init') {
							return <Table.Row key={artifact.lastEvent.timestamp} className={styles.cardActionRow}>
								<Table.Cell>
									<Button
										circular
										compact
										size="mini"
										icon="time"
										onClick={() => this.timeline.show(0, TIMELINE_UPPER_MOD)}
									/>
									{this.parser.formatDuration(artifact.lastEvent.timestamp - this.parser.pull.timestamp)}</Table.Cell>
								<Table.Cell>
									<Trans id="ast.arcana-suggestions.messages.pull">
												Pull
									</Trans>
								</Table.Cell>
								<Table.Cell>
								</Table.Cell>
								{this.RenderSpreadState(artifact)}
							</Table.Row>
						}

						const start = artifact.lastEvent.timestamp - this.parser.pull.timestamp
						const end = start + TIMELINE_UPPER_MOD
						const formattedTime = this.parser.formatDuration(start)

						return <Table.Row key={artifact.lastEvent.timestamp} className={styles.cardActionRow}>
							<Table.Cell>
								{start >= 0 && <Button
									circular
									compact
									size="mini"
									icon="time"
									onClick={() => this.timeline.show(start, end)}
								/>}
								<span style={{marginRight: 10}}>{formattedTime}</span>
							</Table.Cell>
							{this.RenderAction(artifact)}
							{this.RenderSpreadState(artifact)}
						</Table.Row>
					})}
				</Table.Body>
			</Table>
			<Button onClick={() => this.parser.scrollTo(ArcanaSuggestions.handle)}>
				<Trans id="ast.arcana-suggestions.scroll-to-top-button">Jump to start of Arcana Logs</Trans>
			</Button>
		</>
	}

	// Helper for override output()
	RenderAction(artifact: CardLog) {
		if (artifact.lastEvent.type === 'action' && this.play.includes(artifact.lastEvent.action) && artifact.targetJob != null) {
			const targetJob_format_for_actortype = this.StringRemoveSpaceCapitalize(artifact.targetJob) //converted due to formating difference
			const targetJob = getDataBy(JOBS, 'logType', targetJob_format_for_actortype as ActorType)

			return <>
				<Table.Cell>
					<ActionLink {...getDataBy(this.data.actions, 'id', artifact.lastEvent.action)}/>
				</Table.Cell>
				<Table.Cell>
					{targetJob && <JobIcon job={targetJob}/>}
					{artifact.targetName}
				</Table.Cell>
			</>
		}

		//for divination to output how many players buffed
		if (artifact.lastEvent.type === 'action' && artifact.lastEvent.action === this.data.actions.DIVINATION.id) {
			const tableData = this.history.map(window => {
				const end = window.end != null ?
					window.end - this.parser.pull.timestamp :
					window.start - this.parser.pull.timestamp
				const start = window.start - this.parser.pull.timestamp

				return ({
					start,
					end,
					targetsData: {
						buffed: {
							actual: window.playersBuffed.length,
						},
					},
				})
			})
			//whole table was taken even though only playersBuffed is read in case we want separate times noted.

			const playersHit = tableData.map(t=> t.targetsData.buffed.actual)[this.divinationCast]
			this.divinationCast += 1
			return <>
				<Table.Cell>
					<ActionLink {...getDataBy(this.data.actions, 'id', artifact.lastEvent.action)} />
				</Table.Cell>
				<Table.Cell>
					<Trans id="ast.arcana-tracking.divination.playertarget">{'Players Buffed:'}</Trans>
					{' '}
					{playersHit}
					{'/'}
					{PLAYERS_HIT_TARGET}
				</Table.Cell>
			</>
		}

		if (artifact.lastEvent.type === 'action') {
			return <>
				<Table.Cell>
					<ActionLink {...getDataBy(this.data.actions, 'id', artifact.lastEvent.action)} />
				</Table.Cell>
				<Table.Cell>
				</Table.Cell>
			</>
		}

		if (artifact.lastEvent.type === 'death') {
			return <><Table.Cell>
				<Trans id="ast.arcana-tracking.messages.death">Death</Trans>
			</Table.Cell>
			<Table.Cell>
			</Table.Cell>
			</>
		}

		return <>
			<Table.Cell>
			</Table.Cell>
			<Table.Cell>
			</Table.Cell>
		</>
	}

	// Helper for override output()
	RenderSpreadState(artifact: CardLog) {
		const drawnArcana = artifact.drawState ? this.data.getStatus(artifact.drawState) : undefined

		return <Table.Cell>
			<span style={{marginRight: 10, marginLeft: 0}}>
				{drawnArcana && <img
					src={drawnArcana.icon}
					className={styles.buffIcon}
					alt={drawnArcana.name}
				/>}
				{!drawnArcana && <span className={styles.buffPlaceholder} />}
			</span>
			<span className={styles.sealIconContainer}>
				{artifact.sealState.map((sealType, index) => {
					if (sealType > 0) {
						return <img key={index} src={SEAL_ICON[sealType]} className={styles.sealIcon} alt="Seal icon" />
					}
					return <span key={index} className={styles.sealIcon}></span>
				})}
			</span>
			<span style={{marginLeft: 5}}>
				{artifact.sleeveState > 0 && <img
					src={this.sleeveIcon[artifact.sleeveState]}
					className={styles.buffIcon}
					alt={this.data.actions.SLEEVE_DRAW.name}
				/>}
			</span>
		</Table.Cell>
	}

	//Helper for string mismatch since this.parser.actor.job is not the same format as JOBS in ActorType and because I am too dumb to fix otherwise lol
	public StringRemoveSpaceCapitalize(s: string) {
		const searchChar = s.search('_')
		if (searchChar !== -1) {
			return s.charAt(0).toUpperCase() + s.slice(1, searchChar).toLowerCase()
				+ s.charAt(searchChar+1).toUpperCase() + s.slice(searchChar+2).toLowerCase()
		}
		return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
	}
}
