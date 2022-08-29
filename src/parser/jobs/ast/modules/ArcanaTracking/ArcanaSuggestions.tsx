import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink, DataLink} from 'components/ui/DbLink'
import {JobIcon} from 'components/ui/JobIcon'
import {Action, ActionRoot} from 'data/ACTIONS'
import {Job, JOBS} from 'data/JOBS'
import {Status} from 'data/STATUSES'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import {Actor, Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Button, Icon, Table} from 'semantic-ui-react'
import {PLAY} from '../ArcanaGroups'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import styles from './ArcanaSuggestions.module.css'
import ArcanaTracking, {CardState, SealType} from './ArcanaTracking'
import {optimalRoleVerify} from './OptimalRoleVerify'
import sealCelestial from './seal_celestial.png'
import sealLunar from './seal_lunar.png'
import sealSolar from './seal_solar.png'

const TIMELINE_UPPER_MOD = 30000 // in ms

const SEVERITIES = {
	//one chance is given in case the AST fat fingers redraw, but no other chances are given for competent ASTs
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

const SEAL_ICON = {
	[SealType.NOTHING]: '',
	[SealType.SOLAR]: sealSolar,
	[SealType.LUNAR]: sealLunar,
	[SealType.CELESTIAL]: sealCelestial,
}

//actions the deactivate redraw
const REDRAW_DEACTIVATE: Array<keyof ActionRoot> = [
	'REDRAW',
	'UNDRAW',
	...PLAY,
]

interface CardLog extends CardState {
	targetName: Actor['name']
	targetJob: Actor['job']
	role: Job['role']
	ineffectiveRedraw: boolean
}

export default class ArcanaSuggestions extends Analyser {
	static override handle = 'arcanaSuggestions'

	static override title = t('ast.arcana-suggestions.title')`Arcana Logs`
	static override displayOrder = DISPLAY_ORDER.ARCANA_TRACKING

	@dependency private data!: Data
	@dependency private arcanaTracking!: ArcanaTracking
	@dependency private timeline!: Timeline
	@dependency private actors!: Actors
	@dependency private suggestions!: Suggestions

	private arcanaLogsTable: JSX.Element = <></>

	private cardLogs: CardLog[] = []
	private play: Array<Action['id']> = []

	//for redraw suggestions
	private redrewWhenAlreadyUniqueSeal: number = 0
	private couldHaveRedrawnInsteadSettled: number = 0
	private previousCard: Status['id'] | undefined = undefined
	private previousSealState: SealType[] | undefined = undefined
	private redrawActive: boolean = false
	private redrawDeactivate: Array<Action['id']> = []

	override initialise() {
		this.play = PLAY.map(actionKey => this.data.actions[actionKey].id)
		this.redrawDeactivate = REDRAW_DEACTIVATE.map(actionKey => this.data.actions[actionKey].id)
		this.addEventHook('complete', this._onComplete)
	}

	private _onComplete() {
		this.cardLogs = this.arcanaTracking.cardLogs.map(artifact => {
			if (artifact.lastEvent.type === 'action') {
				//for redraw suggestions
				let ineffectiveRedraw = false
				if (this.previousCard !== undefined && this.previousSealState !== undefined) {
					if (artifact.lastEvent.action === this.data.actions.REDRAW.id
						&& !this.previousSealState.includes(this.arcanaTracking.sealState(this.previousCard))) {
						//suggest if redraw occurred, but redraw was not necessary (i.e. had new unique seal and redrew exposing risk to getting not unique seal)
						this.redrewWhenAlreadyUniqueSeal += 1
						ineffectiveRedraw = true
					} else if (this.redrawActive
								&& this.play.includes(artifact.lastEvent.action)
								&& this.arcanaTracking.sealState(this.previousCard) !== SealType.NOTHING
								&& this.previousSealState.includes(this.arcanaTracking.sealState(this.previousCard))) {
						//if redraw is active, but the action performed is play AND the card drawn previously not a unique seal, then add to suggestion
						this.couldHaveRedrawnInsteadSettled += 1
						ineffectiveRedraw = true
					}
				}

				//activate redraw when applicable. note: no case when someone uses status off since that case is done as part of arcana tracking and the result is undraw
				if (artifact.lastEvent.action === this.data.actions.DRAW.id) {
					this.redrawActive = true
				} else if (this.redrawDeactivate.includes(artifact.lastEvent.action)) {
					this.redrawActive = false
				}

				//to track last card for suggestion purposes
				this.previousCard = artifact.drawState
				this.previousSealState = artifact.sealState

				//end of section for redraw

				const targetId = artifact.lastEvent.target
				const target = this.actors.get(targetId)
				const cardLog: CardLog = {
					...artifact,
					targetName: target.name,
					targetJob: target.job,
					role: JOBS[target.job].role,
					ineffectiveRedraw: ineffectiveRedraw,
				}
				return cardLog
			}
			const cardLog: CardLog = {
				...artifact,
				targetName: '',
				targetJob: 'UNKNOWN',
				role: 'UNSUPPORTED',
				ineffectiveRedraw: false,
			}
			return cardLog
		})

		/*
		* Redraw suggestions
		*/

		if (this.redrewWhenAlreadyUniqueSeal > 0) {
			/*
			SUGGESTION: redrawed even though different seal already held
			*/
			const differentSealContent = <Trans id="ast.redraw.suggestions.different-seal.content">
				Try to use <DataLink action="REDRAW" /> only when you need a different seal than the seals you already have for <DataLink action="ASTRODYNE" />.
			</Trans>

			const differentSealWhy = <Trans id="ast.draw.suggestions.different-seal.why">
				Using <DataLink action="REDRAW" showIcon={false}/> when you already have a different seal only creates risk that you will draw a seal you already have. You used <DataLink action="REDRAW" showIcon={false}/> <Plural value={this.redrewWhenAlreadyUniqueSeal} one="once" other="# times" /> when you already had a different seal.
			</Trans>
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.REDRAW.icon,
				content: differentSealContent,
				tiers: SEVERITIES,
				value: this.redrewWhenAlreadyUniqueSeal,
				why: differentSealWhy,
			}))
		}

		if (this.couldHaveRedrawnInsteadSettled > 0) {
			/*
			SUGGESTION: didn't redraw when there was opportunity to get a different seal
			*/
			const sameSealContent = <Trans id="ast.redraw.suggestions.same-seal.content">
					Try to use <DataLink action="REDRAW" /> when you have a card with a seal that's the same as the ones you already have for <DataLink action="ASTRODYNE" /> when <DataLink action="REDRAW" showIcon={false} /> is available.
			</Trans>

			const sameSealWhy = <Trans id="ast.redraw.suggestions.same-seal.why">
					Using <DataLink action="PLAY" /> or <DataLink action="UNDRAW" /> when you have a seal that's the same as the ones you already have ensures that <DataLink action="ASTRODYNE" showIcon={false}/> won't give you its full potential. You used <DataLink action="PLAY" showIcon={false} /> or <DataLink action="UNDRAW" showIcon={false} /> <Plural value={this.couldHaveRedrawnInsteadSettled} one="once" other="# times" /> when you already had the same seal while <DataLink action="REDRAW"  showIcon={false} /> was active.
			</Trans>

			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.REDRAW.icon,
				content: sameSealContent,
				tiers: SEVERITIES,
				value: this.couldHaveRedrawnInsteadSettled,
				why: sameSealWhy,
			}))
		}

		const starsForRedraw = this.redrewWhenAlreadyUniqueSeal > 0 || this.couldHaveRedrawnInsteadSettled > 0 ? '**' : undefined

		const redrawRedundancyHeader = this.redrewWhenAlreadyUniqueSeal > 0
			? <Trans id="ast.arcana-suggestions.messages.redraw-redundancy">
				The crossmark for <ActionLink action="REDRAW" /> indicates that a redraw was performed when not necessary such as redrawing when a unique seal has already been obtained.
			</Trans>
			: undefined

		const redrawIneffectiveUseHeader = this.couldHaveRedrawnInsteadSettled > 0
			? <Trans id="ast.arcana-suggestions.messages.redraw-ineffective">
				The crossmark symbol beside <ActionLink action="PLAY" /> actions indicates that a redraw was available and you had played a seal that you already have.
			</Trans>
			: undefined

		//end of redraw suggestions

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
				{starsForRedraw}
				{redrawRedundancyHeader}
				{' '}
				{redrawIneffectiveUseHeader}
			</p>
			<p>
				<Trans id="ast.arcana-suggestions.messages.optimal-role">
					*** The checkmarks and crossmarks for each target indicate whether the card was placed on a technically optimal role to utilize the 6% damage increase compared to the 3% damage increase on non-optimal roles. (A suggestion has not been generated for this aspect as a technically optimal target might not be the optimal target and an AST should be relatively aware of players abilities when handing out cards to account for this.)
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
							<Trans id="ast.arcana-suggestions.messages.latest-action">Lastest Action</Trans> {starsForRedraw}
						</Table.HeaderCell>
						<Table.HeaderCell width={2}>
							<Trans id="ast.arcana-suggestions.messages.target">Target</Trans>***
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
	}

	override output() {

		return <Fragment>
			{this.arcanaLogsTable}
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
					{this.ineffectiveRedrawDisplay(artifact.lastEvent.action, artifact.ineffectiveRedraw)}
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
					{this.ineffectiveRedrawDisplay(artifact.lastEvent.action, artifact.ineffectiveRedraw)}
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

	/**
	 * returns icon checkmark or cross when true or false respectively
	 *
	 * @param rulePassed {boolean | undefined} true, false, or undefined depending on if you need checkmark, cross, or nothing
	 * @return {Icon | undefined} checkmark, cross, or nothing
	 */
	private getNotesIcon(rulePassed: boolean | undefined) {
		if (rulePassed === undefined) {
			return
		}
		return <Icon
			name={rulePassed ? 'checkmark' : 'remove'}
			className={rulePassed ? 'text-success' : 'text-error'}
		/>
	}

	/**
	 *
	 * @param actionId {Action['id]} action id of either REDRAW or something from PLAY
	 * @param ineffectiveRedraw {boolean} was the redraw ineffective (redrew too soon or not at all)
	 * @returns {Icon | undefined} icon based on criteria noted (cross if ineffective, nothing otherwise)
	 */
	private ineffectiveRedrawDisplay(actionId: Action['id'], ineffectiveRedraw: boolean) {
		if (!ineffectiveRedraw) { return }
		if (this.play.includes(actionId) || this.data.actions.REDRAW.id === actionId) {
			return this.getNotesIcon(!ineffectiveRedraw)
		}
		return
	}
}
