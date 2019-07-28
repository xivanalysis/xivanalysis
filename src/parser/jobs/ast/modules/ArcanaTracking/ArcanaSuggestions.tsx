import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import JobIcon from 'components/ui/JobIcon'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import STATUSES from 'data/STATUSES'
import {ActorType} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import Timeline from 'parser/core/modules/Timeline'
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

const SLEEVE_ICON = {
	[SleeveType.NOTHING]: '',
	[SleeveType.ONE_STACK]: STATUSES.SLEEVE_DRAW.icon,
	[SleeveType.TWO_STACK]: 'https://xivapi.com/i/019000/019562.png',
}

const SEAL_ICON = {
	[SealType.NOTHING]: '',
	[SealType.SOLAR]: sealSolar,
	[SealType.LUNAR]: sealLunar,
	[SealType.CELESTIAL]: sealCelestial,
}

interface CardLog extends CardState {
	targetName?: string
	targetJob?: string
}

export default class ArcanaSuggestions extends Module {
	static handle = 'arcanaSuggestions'

	static title = t('ast.arcana-suggestions.title')`Arcana Logs`
	static displayOrder = DISPLAY_ORDER.ARCANA_TRACKING

	@dependency private combatants!: Combatants
	@dependency private arcanaTracking!: ArcanaTracking
	@dependency private timeline!: Timeline

	private cardLogs: CardLog[] = []
	private partyComp: string[] = []

	protected init() {
		this.addHook('complete', this._onComplete)
	}

	private _onComplete() {
		const combatants = this.combatants.getEntities()
		for (const [key, combatant] of Object.entries(combatants)) {
			if (combatant.type === 'LimitBreak') {
				continue
			}
			this.partyComp.push(combatant.type)
		}

		this.cardLogs = this.arcanaTracking.cardLogs.map(artifact => {
			const target = artifact.lastEvent.targetID !== this.parser.player.id ? this.combatants.getEntity(artifact.lastEvent.targetID) : null

			const cardLog: CardLog = {
				...artifact,
				targetName: target ? target.name : null,
				targetJob: target ? target.type : null,
			}
			return cardLog
		})
	}

	output() {
		return <>
		<p>
			<Trans id="ast.arcana-suggestions.messages.explanation">
				This section keeps track of every card action made during the fight, and the state of the spread after each action.
			</Trans>
		</p>
		<p>
			<Trans id="ast.arcana-suggestions.messages.footnote">
				* No pre-pull actions are being represented aside from <ActionLink {...ACTIONS.PLAY} />, and this is only an approximation based on the buff duration.
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
							if (artifact.lastEvent.type === 'pull') {
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
							} else {
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
							}
						})}
					</Table.Body>
				</Table>
				<Button onClick={() => this.parser.scrollTo(ArcanaSuggestions.handle)}>
					<Trans id="ast.arcana-suggestions.scroll-to-top-button">Jump to start of Arcana Logs</Trans>
				</Button>
		</>
	}

	// Helper for output()
	RenderAction(artifact: CardLog) {
		if (artifact.lastEvent.type === 'cast' && PLAY.includes(artifact.lastEvent.ability.guid) ) {
			const targetJob = getDataBy(JOBS, 'logType', artifact.targetJob as ActorType)

			return <>
			<Table.Cell>
				<ActionLink {...getDataBy(ACTIONS, 'id', artifact.lastEvent.ability.guid)} />
			</Table.Cell>
			<Table.Cell>
				{targetJob && <JobIcon job={targetJob}/>}
				{artifact.targetName}
			</Table.Cell>
			</>
		} else if (artifact.lastEvent.type === 'cast' ) {
			return <>
				<Table.Cell>
					<ActionLink {...getDataBy(ACTIONS, 'id', artifact.lastEvent.ability.guid)} />
				</Table.Cell>
				<Table.Cell>
				</Table.Cell>
			</>
		} else if (artifact.lastEvent.type === 'death') {
			return <><Table.Cell>
				<Trans id="ast.arcana-tracking.messages.death">Death</Trans>
			</Table.Cell>
			<Table.Cell>
			</Table.Cell>
			</>
		} else {
			return <>
				<Table.Cell>
				</Table.Cell>
				<Table.Cell>
				</Table.Cell>
			</>
		}
	}

	// Helper for output()
	RenderSpreadState(artifact: CardLog) {
		const drawnArcana = getDataBy(STATUSES, 'id', artifact.drawState)

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
			{artifact.sealState.map(sealType => {
				if (sealType > 0) {
					return <img src={SEAL_ICON[sealType]} className={styles.sealIcon} alt="Seal icon" />
				} else {
					return <span className={styles.sealIcon}></span>
				}
			})}
			</span>
			<span style={{marginLeft: 5}}>
			{artifact.sleeveState > 0 && <img
				src={SLEEVE_ICON[artifact.sleeveState]}
				className={styles.buffIcon}
				alt={ACTIONS.SLEEVE_DRAW.name}
			/>}
			</span>
		</Table.Cell>
	}
}
