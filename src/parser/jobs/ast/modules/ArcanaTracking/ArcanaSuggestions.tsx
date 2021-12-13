import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import JobIcon from 'components/ui/JobIcon'
import {Action} from 'data/ACTIONS'
import {JOBS} from 'data/JOBS'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import {Actor, Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {Button, Table} from 'semantic-ui-react'
import {PLAY} from '../ArcanaGroups'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import styles from './ArcanaSuggestions.module.css'
import ArcanaTracking, {CardState, SealType} from './ArcanaTracking'
import sealCelestial from './seal_celestial.png'
import sealLunar from './seal_lunar.png'
import sealSolar from './seal_solar.png'

const TIMELINE_UPPER_MOD = 30000 // in ms

const SEAL_ICON = {
	[SealType.NOTHING]: '',
	[SealType.SOLAR]: sealSolar,
	[SealType.LUNAR]: sealLunar,
	[SealType.CELESTIAL]: sealCelestial,
}

interface CardLog extends CardState {
	targetName: Actor['name']
	targetJob: Actor['job']
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

	override initialise() {
		this.play = PLAY.map(actionKey => this.data.actions[actionKey].id)

		this.addEventHook('complete', this._onComplete)
	}

	private _onComplete() {
		this.cardLogs = this.arcanaTracking.cardLogs.map(artifact => {
			if (artifact.lastEvent.type === 'action') {
				const targetId = artifact.lastEvent.target
				const target = this.actors.get(targetId)
				const cardLog: CardLog = {
					...artifact,
					targetName: target.name,
					targetJob: target.job,
				}
				return cardLog
			}
			const cardLog: CardLog = {
				...artifact,
				targetName: '',
				targetJob: 'UNKNOWN',
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
				* No pre-pull actions are being represented aside from <ActionLink action="PLAY" />, and this is only an approximation based on the buff duration.
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
			const targetJob = JOBS[artifact.targetJob]

			return <>
				<Table.Cell>
					<ActionLink {...this.data.getAction(artifact.lastEvent.action)}/>
				</Table.Cell>
				<Table.Cell>
					{targetJob && <JobIcon job={targetJob}/>}
					{artifact.targetName}
				</Table.Cell>
			</>
		}

		if (artifact.lastEvent.type === 'action') {
			return <>
				<Table.Cell>
					<ActionLink {...this.data.getAction(artifact.lastEvent.action)} />
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
		</Table.Cell>
	}
}
