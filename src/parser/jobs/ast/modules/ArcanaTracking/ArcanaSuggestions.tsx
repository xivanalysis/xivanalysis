import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {JobIcon} from 'components/ui/JobIcon'
import {Action} from 'data/ACTIONS'
import {Job, JOBS} from 'data/JOBS'
import {Status} from 'data/STATUSES'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import {Actor, Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment, ReactFragment} from 'react'
import {Accordion, Button, Icon, Message, Table} from 'semantic-ui-react'
import {PLAY} from '../ArcanaGroups'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import styles from './ArcanaSuggestions.module.css'
import ArcanaTracking, {CardState, SealType} from './ArcanaTracking'
import ArcanaTrackingOptimized, {PartyState} from './ArcanaTrackingOptimized'
import {optimalRoleVerify} from './OptimalRoleVerify'
import sealCelestial from './seal_celestial.png'
import sealLunar from './seal_lunar.png'
import sealSolar from './seal_solar.png'

const TIMELINE_UPPER_MOD = 30000 // in ms
const OPTIMAL_CARD_PERCENTAGE = 0.06
const NOT_OPTIMAL_CARD_PERCENTAGE = 0.03
const PARTY_DAMAGE_ROWS_SHOW = 3 //maximum of 3 party members are shown for this purpose
const MAX_PARTY_MEMBERS = 8

const SEAL_ICON = {
	[SealType.NOTHING]: '',
	[SealType.SOLAR]: sealSolar,
	[SealType.LUNAR]: sealLunar,
	[SealType.CELESTIAL]: sealCelestial,
}

interface CardLog extends CardState {
	targetName: Actor['name']
	targetJob: Actor['job']
	role: Job['role']
}

interface PartyLog extends PartyState {
	targetName: Actor['name']
	targetJob: Actor['job']
	role: Job['role']
}

export default class ArcanaSuggestions extends Analyser {
	static override handle = 'arcanaSuggestions'

	static override title = t('ast.arcana-suggestions.title')`Arcana Logs`
	static override displayOrder = DISPLAY_ORDER.ARCANA_TRACKING

	@dependency private data!: Data
	@dependency private arcanaTracking!: ArcanaTracking
	@dependency private arcanaTrackingOptimized!: ArcanaTrackingOptimized
	@dependency private timeline!: Timeline
	@dependency private actors!: Actors

	private arcanaLogsTable: JSX.Element = <></>
	private optimalCardTable: JSX.Element = <></>

	private cardLogs: CardLog[] = []
	private partyLogs: PartyLog[] = []
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
					role: JOBS[target.job].role,
				}
				return cardLog
			}
			const cardLog: CardLog = {
				...artifact,
				targetName: '',
				targetJob: 'UNKNOWN',
				role: 'UNSUPPORTED',
			}
			return cardLog
		})

		this.partyLogs = this.arcanaTrackingOptimized.partyLogs.map(artifact => {
			if (artifact.lastEvent.type === 'statusApply') {
				const targetId = artifact.lastEvent.target
				const target = this.actors.get(targetId)
				const partyLog: PartyLog = {
					...artifact,
					targetName: target.name,
					targetJob: target.job,
					role: JOBS[target.job].role,
				}
				return partyLog
			}
			const partyLog: PartyLog = {
				...artifact,
				targetName: '',
				targetJob: 'UNKNOWN',
				role: 'UNSUPPORTED',
			}
			return partyLog
		})

		const timeHeader = <Trans id="ast.arcana-suggestions.messages.time">Time</Trans>

		this.arcanaLogsTable = <>
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
			<p>
				<Trans id="ast.arcana-suggestions.messages.optimal-role">
					** The checkmarks and crossmarks indicate whether the card was placed on a technically optimal role to utilize the 6% damage increase compared to the 3% damage increase on non-optimal roles. <br/>
				</Trans>
			</p>
			<Table collapsing unstackable className={styles.cardActionTable}>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell width={1}>
							{timeHeader}
						</Table.HeaderCell>
						<Table.HeaderCell width={1}>
							<Trans id="ast.arcana-suggestions.messages.latest-action">Lastest Action</Trans>
						</Table.HeaderCell>
						<Table.HeaderCell width={2}>
							<Trans id="ast.arcana-suggestions.messages.target">Target</Trans>**
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
		</>

		this.optimalCardTable = <>
			<p>
				<Trans id="ast.arcana-suggestions.messages.optimal-explanation">
					This section keeps track of cards that were placed on party members, who the optimal target would have been, and party-level damage during this window excluding already played cards for the top three damage dealers.
				</Trans>
			</p>
			<Message warning icon>
				<Icon name="frown" /> <Trans id="ast.arcana-suggestions.messages.optimal-disclaimer">
					Please note the following disclaimers regarding this analysis.
					<ul>
						<li>This analysis is only for information purposes and therefore, no suggestions will be generated from this. </li>
						<li>This analysis should only be considered for potential window improvements as the below information can easily feed into confirmation bias. </li>
						<li>This analysis cannot tell the future since it is impossible to recreate the exact same scenario including critical/direct hits and since an Astrologian cannot directly control other party members to maximize damage output.</li>
						<li>This analysis was not created to show the optimal times to play cards, but rather see who the best target would have been at the exact time played. No other optimization techniques have been employed.</li>
						<li>This analysis is only constructed using end game abilities and therefore, may not reflect abilities in lower level content including any non-level-capped ultimates. </li>
					</ul>
				</Trans>
			</Message>
			<Message icon>
				<Icon name="key" /> <Trans id="ast.arcana-suggestions.messages.optimal-assumptions">
				Key assumptions in this analysis:
					<ul>
						<li>Cards played would have been played at the same time regardless of player positions and other circumstances; </li>
						<li>Critical hits, direct hits, and other RNG factors would have happened anyway; and </li>
						<li>Players included in this log are party members that can receive cards (up to 8 members). </li>
					</ul>
				</Trans>
			</Message>
			<Table collapsing unstackable className={styles.cardActionTable}>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell width={1}>
							{timeHeader}
						</Table.HeaderCell>
						<Table.HeaderCell width={1}>
							<Trans id="ast.arcana-suggestions.header.optimal.card">Card Played</Trans>
						</Table.HeaderCell>
						<Table.HeaderCell width={2}>
							<Trans id="ast.arcana-suggestions.header.optimal.target">Target info</Trans>
						</Table.HeaderCell>
						<Table.HeaderCell width={2}>
							<Trans id="ast.arcana-suggestions.header.optimal.party-damage">Top three damage dealers during window <br/>(excluding applied cards)</Trans>
						</Table.HeaderCell>
						<Table.HeaderCell width={2}>
							<Trans id="ast.arcana-suggestions.header.optimal.card-damage">Additional damage if card was applied</Trans>
						</Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{this.partyLogs.map(artifact => {
						const start = artifact.lastEvent.timestamp - this.parser.pull.timestamp
						const end = start + TIMELINE_UPPER_MOD
						const formattedTime = this.parser.formatDuration(start)
						const actualTarget = this.actors.get(artifact.actualTarget)
						const optimalArtifact = this.obtainOptimalTarget(artifact)
						let optimalTarget = 'No one'
						let optimalJobIcon = <></>
						if (optimalArtifact !== 'No one') {
							optimalTarget = optimalArtifact.name
							optimalJobIcon = <JobIcon job={JOBS[optimalArtifact.job]} />
						}

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
							<Table.Cell>
								<StatusLink {...this.data.getStatus(artifact.card)}/>
							</Table.Cell>
							<Table.Cell>
								<Trans id="ast.arcana-suggestions.messages.actual-target">Actual target</Trans>: <br/>
								<JobIcon job={JOBS[actualTarget.job]} /> {actualTarget.name} {this.getNotesIcon(optimalTarget === actualTarget.name)} <br/>
								<Trans id="ast.arcana-suggestions.messages.optimal-target">Optimal target</Trans>: <br/>
								{optimalJobIcon} {optimalTarget} </Table.Cell>
							<Table.Cell> {this.RenderPartyDamageList(artifact.partyDamage, artifact.partyMembersWithCards)} </Table.Cell>
							<Table.Cell> {this.RenderPartyDamageList(this.obtainOptimalTable(artifact), artifact.partyMembersWithCards)} </Table.Cell>
						</Table.Row>
					})}
				</Table.Body>
			</Table>
		</>
	}

	override output() {

		const aboveCombatantLimit: boolean = MAX_PARTY_MEMBERS >= this.parser.pull.actors.filter(actor => actor.playerControlled).length

		const panels = [{
			key: 'optimal table',
			title: {
				content: <>
					<strong><Trans id="ast.arcana-suggestions.optimal-target-table.title">Optimal Target Table</Trans></strong>
				</>,
			},
			content: {
				content: this.optimalCardTable,
			},
		}]

		const optimalTable: JSX.Element = <>
			<br/>
			<Accordion
				exclusive={false}
				styled
				fluid
				panels={panels} />
		</>

		return <Fragment>
			{this.arcanaLogsTable}
			{aboveCombatantLimit && optimalTable}
			<br/>
			<Button onClick={() => this.parser.scrollTo(ArcanaSuggestions.handle)}>
				<Trans id="ast.arcana-suggestions.scroll-to-top-button">Jump to start of Arcana Logs</Trans>
			</Button>
		</Fragment>
	}

	// Helper for override output()
	private RenderAction(artifact: CardLog) {
		const optimalRole = artifact.lastEvent.type !== 'action' ? undefined : optimalRoleVerify(artifact.role, artifact.lastEvent.action)

		if (artifact.lastEvent.type === 'action' && this.play.includes(artifact.lastEvent.action) && artifact.targetJob != null) {
			const targetJob = JOBS[artifact.targetJob]

			return <>
				<Table.Cell>
					<ActionLink {...this.data.getAction(artifact.lastEvent.action)}/>
				</Table.Cell>
				<Table.Cell>
					{this.getNotesIcon(optimalRole)}
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
	private RenderSpreadState(artifact: CardLog) {
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

	private RenderPartyDamageList(partyDamage: { [id: Actor['id']]: number}, partyMembersWithCards: { [id: Actor['id']]: {percentage: number, card: Status['id']}} | undefined) {
		let partyList: ReactFragment = <></>
		let counter = 0
		this.dictionarySort(partyDamage).forEach(element => {
			const actorElement = this.actors.get(element)
			counter ++
			if (counter > PARTY_DAMAGE_ROWS_SHOW) { return }
			if (partyMembersWithCards !== undefined && partyMembersWithCards[actorElement.id] !== undefined) {
				partyList = <>{partyList} <StatusLink {...this.data.getStatus(partyMembersWithCards[actorElement.id].card)} showName={false} /> <JobIcon job={JOBS[actorElement.job]} /> {actorElement.name}:  {this.numberWithCommas(partyDamage[element])} <br/></>
			} else {
				partyList = <>{partyList} <JobIcon job={JOBS[actorElement.job]} /> {actorElement.name}:  {this.numberWithCommas(partyDamage[element])} <br/></>
			}
		})
		return partyList
	}

	private obtainOptimalTarget(partyLog: PartyLog) {
		//this one is used to get the damage that would have been output by applying the card to the party member
		let optimalDamage = this.dictionarySort(this.obtainOptimalTable(partyLog))

		if (partyLog.partyMembersWithCards !== undefined) {
			optimalDamage = optimalDamage.filter(item =>
				//yeah I hope it's undefined lol
				partyLog.partyMembersWithCards[item] === undefined
			)
		}
		if (optimalDamage.length !== 0) {
			return this.actors.get(optimalDamage[0])
		}
		return 'No one'
	}

	private obtainOptimalTable(partyLog: PartyLog) {
		const optimalDamage: { [id: Actor['id']]: number} = {}
		for (const key in partyLog.partyDamage) {
			optimalDamage[key] = partyLog.partyDamage[key] *
				(optimalRoleVerify(JOBS[this.actors.get(key).job].role, partyLog.card) ?  OPTIMAL_CARD_PERCENTAGE : NOT_OPTIMAL_CARD_PERCENTAGE)
		}

		return optimalDamage
	}

	private getNotesIcon(rulePassed: boolean | undefined) {
		if (rulePassed === undefined) {
			return
		}
		return <Icon
			name={rulePassed ? 'checkmark' : 'remove'}
			className={rulePassed ? 'text-success' : 'text-error'}
		/>
	}

	private dictionarySort(dict: object) {
		// Create the array of key-value pairs
		const items = Object.keys(dict).map(
			(key) => { return [key, dict[key]] })

		// Sort the array based on the second element (i.e. the value)
		items.sort(
			(first, second) => { return first[1] - second[1] }
		).reverse()

		// Obtain the list of keys in sorted order of the values.
		const keys = items.map(
			(e) => { return e[0] })

		return keys
	}

	private numberWithCommas(x: number): string {
		return Math.floor(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
	}
}
