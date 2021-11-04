import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import JobIcon from 'components/ui/JobIcon'
import {getDataBy} from 'data'
import {JOBS} from 'data/JOBS'
import {ActorType, BuffEvent, CastEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import {Data} from 'parser/core/modules/Data'
import {NormalisedApplyBuffEvent} from 'parser/core/modules/NormalisedEvents'
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

class DIVWindow {
	start: number
	end?: number

	rotation: Array<NormalisedApplyBuffEvent | CastEvent> = []
	gcdCount: number = 0
	trailingGcdEvent?: CastEvent

	buffsRemoved: number[] = []
	playersBuffed: number = 0
	containsOtherAST: boolean = false

	constructor(start: number) {
		this.start = start
	}
}
//end set-up for div

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
	targetName?: string
	targetJob?: string
}

export default class ArcanaSuggestions extends Module {
	static override handle = 'arcanaSuggestions'

	static override title = t('ast.arcana-suggestions.title')`Arcana Logs`
	static override displayOrder = DISPLAY_ORDER.ARCANA_TRACKING

	@dependency private data!: Data
	@dependency private combatants!: Combatants
	@dependency private arcanaTracking!: ArcanaTracking
	@dependency private timeline!: Timeline

	private cardLogs: CardLog[] = []
	private partyComp: string[] = []

	private PLAY: number[] = []

	private SLEEVE_ICON: SleeveIcon = {}

	//div privates for output
	private history: DIVWindow[] = []
	private lastDIVFalloffTime: number = 0
	private divCast: number = 0
	//end div privates

	protected override init() {
		PLAY.forEach(actionKey => {
			this.PLAY.push(this.data.actions[actionKey].id)
		})

		this.SLEEVE_ICON = {
			[SleeveType.NOTHING]: '',
			[SleeveType.ONE_STACK]: this.data.statuses.SLEEVE_DRAW.icon,
			[SleeveType.TWO_STACK]: 'https://xivapi.com/i/019000/019562.png',
		}

		//used for divination tracking
		this.addEventHook('normalisedapplybuff', {to: 'player', abilityId: this.data.statuses.DIVINATION.id}, this.tryOpenWindow)
		this.addEventHook('normalisedapplybuff', {by: 'player', abilityId: this.data.statuses.DIVINATION.id}, this.countDIVBuffs)
		this.addEventHook('removebuff', {to: 'player', abilityId: this.data.statuses.DIVINATION.id}, this.tryCloseWindow)
		this.addEventHook('cast', {by: 'player'}, this.onCast)

		this.addEventHook('complete', this._onComplete)
	}

	//functions for divination buff counting
	private countDIVBuffs(event: NormalisedApplyBuffEvent) {
		// Get this from tryOpenWindow. If a window wasn't open, we'll open one.
		const lastWindow: DIVWindow | undefined = this.tryOpenWindow(event)

		// Find out how many players we hit with the buff.
		if (lastWindow) {
			lastWindow.playersBuffed += event.confirmedEvents.filter(hit => this.parser.fightFriendlies.findIndex(f => f.id === hit.targetID) >= 0).length
		}
	}

	private tryOpenWindow(event: NormalisedApplyBuffEvent): DIVWindow | undefined {
		const lastWindow: DIVWindow | undefined = _.last(this.history)

		if (lastWindow && !lastWindow.end) {
			return lastWindow
		}

		if (event.sourceID && event.sourceID === this.parser.player.id) {
			const newWindow = new DIVWindow(event.timestamp)

			// Handle multiple AST's buffs overwriting each other, we'll have a remove then an apply with the same timestamp
			// If that happens, mark the window and return
			newWindow.containsOtherAST = this.lastDIVFalloffTime === event.timestamp
			//TODO use this to track if overwritten. Consider moving this tip to suggestions

			this.history.push(newWindow)
			return newWindow
		}

		return undefined
	}

	private tryCloseWindow(event: BuffEvent) {
		// for determining overwrite, cache the status falloff time
		this.lastDIVFalloffTime = event.timestamp

		// only track the things one player added
		if (event.sourceID && event.sourceID !== this.parser.player.id) { return }

		const lastWindow: DIVWindow | undefined = _.last(this.history)

		if (!lastWindow) {
			return
		}

		// Cache whether we've seen a buff removal event for this status, just in case they happen at exactly the same timestamp
		lastWindow.buffsRemoved.push(event.ability.guid)

		if (this.isWindowOkToClose(lastWindow)) {
			lastWindow.end = event.timestamp
		}
	}

	// Make sure all applicable statuses have fallen off before the window closes
	private isWindowOkToClose(window: DIVWindow): boolean {
		if (!window.buffsRemoved.includes(this.data.statuses.DIVINATION.id)) {
			return false
		}
		return true
	}

	private onCast(event: CastEvent) {
		const lastWindow: DIVWindow | undefined = _.last(this.history)

		// If we don't have a window, bail
		if (!lastWindow) {
			return
		}

		const action = this.data.getAction(event.ability.guid)

		// Can't do anything else if we didn't get a valid action object
		if (!action) {
			return
		}

		// If this window isn't done yet add the action to the list
		if (!lastWindow.end) {
			lastWindow.rotation.push(event)

			if (action.onGcd) {
				lastWindow.gcdCount++
			}
			if (lastWindow.playersBuffed < 1) {
				lastWindow.containsOtherAST = true
			}
			return
		}

		// If we haven't recorded a trailing GCD event for this closed window, do so now
		if (lastWindow.end && !lastWindow.trailingGcdEvent && action.onGcd) {
			lastWindow.trailingGcdEvent = event
		}
	}
	//end divination functions

	private _onComplete() {
		const combatants = this.combatants.getEntities()
		for (const [, combatant] of Object.entries(combatants)) {
			if (combatant.type === 'LimitBreak') {
				continue
			}
			this.partyComp.push(combatant.type)
		}

		this.cardLogs = this.arcanaTracking.cardLogs.map(artifact => {
			const targetId = artifact.lastEvent.type !== 'init'
				? artifact.lastEvent.targetID
				: undefined
			const target = targetId !== this.parser.player.id
				? this.combatants.getEntity(targetId)
				: this.combatants.selected

			const cardLog: CardLog = {
				...artifact,
				targetName: target ? target.name : null,
				targetJob: target ? target.type : null,
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
				* No pre-pull actions are being represented aside from <ActionLink {...this.data.actions.PLAY} />, and this is only an approximation based on the buff duration.
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
									{this.parser.formatTimestamp(artifact.lastEvent.timestamp)}</Table.Cell>
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

						const start = artifact.lastEvent.timestamp - this.parser.fight.start_time
						const end = start + TIMELINE_UPPER_MOD
						const formattedTime = this.parser.formatTimestamp(artifact.lastEvent.timestamp)

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
		const divID = this.data.actions.DIVINATION.id

		if (artifact.lastEvent.type === 'cast' && this.PLAY.includes(artifact.lastEvent.ability.guid)) {
			const targetJob = getDataBy(JOBS, 'logType', (artifact.targetJob ?? ActorType.UNKNOWN) as ActorType)

			return <>
				<Table.Cell>
					<ActionLink {...getDataBy(this.data.actions, 'id', artifact.lastEvent.ability.guid)} />
				</Table.Cell>
				<Table.Cell>
					{targetJob && <JobIcon job={targetJob}/>}
					{artifact.targetName}
				</Table.Cell>
			</>
		}

		//for divination to output how many players buffed
		if (artifact.lastEvent.type === 'cast' && artifact.lastEvent.ability.guid === divID) {
			const tableData = this.history.map(window => {
				const end = window.end != null ?
					window.end - this.parser.fight.start_time :
					window.start - this.parser.fight.start_time
				const start = window.start - this.parser.fight.start_time

				return ({
					start,
					end,
					targetsData: {
						buffed: {
							actual: window.playersBuffed,
						},
					},
				})
			})
			//whole table was taken even though only playersBuffed is read in case we want separate times noted.

			const playersHit = tableData.map(t=> t.targetsData.buffed.actual)[this.divCast]
			this.divCast += 1
			return <>
				<Table.Cell>
					<ActionLink {...getDataBy(this.data.actions, 'id', artifact.lastEvent.ability.guid)} />
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

		if (artifact.lastEvent.type === 'cast') {
			return <>
				<Table.Cell>
					<ActionLink {...getDataBy(this.data.actions, 'id', artifact.lastEvent.ability.guid)} />
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
					src={this.SLEEVE_ICON[artifact.sleeveState]}
					className={styles.buffIcon}
					alt={this.data.actions.SLEEVE_DRAW.name}
				/>}
			</span>
		</Table.Cell>
	}
}
