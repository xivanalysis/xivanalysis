import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink, StatusLink} from 'components/ui/DbLink'
import {RotationTargetOutcome} from 'components/ui/RotationTable'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import _ from 'lodash'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {
	EvaluatedAction,
	ExpectedActionGroupsEvaluator,
	ExpectedActionsEvaluator,
	TrackedAction,
	TrackedActionGroup,
	TrackedActionsOptions,
} from 'parser/core/modules/ActionWindow'
import {RequiredGcdCountEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RequiredGcdCountEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Actors} from 'parser/core/modules/Actors'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'
import {Team} from 'report'
import {Button, Icon, Message, Table} from 'semantic-ui-react'
import {isDefined} from 'utilities'
import NormalisedMessage from '../../../../../components/ui/NormalisedMessage'
import {BuffGroupWindow} from '../../../../core/modules/ActionWindow/windows/BuffGroupWindow'
import DISPLAY_ORDER from '../DISPLAY_ORDER'

// Minimum muse GCDs needed to expect a burst window to have 9 GCDs
const MIN_MUSE_GCDS = 2

const APEX_OPENER_BUFFER = 60000 // time it takes on average to fill the first Apex Arrow

const SUPPORT_ACTIONS: ActionKey[] = [
	'ARMS_LENGTH',
	'FOOT_GRAZE',
	'HEAD_GRAZE',
	'LEG_GRAZE',
	'NATURES_MINNE',
	'PELOTON',
	'REPELLING_SHOT',
	'SECOND_WIND',
	'SPRINT',
	'THE_WARDENS_PAEAN',
	'TROUBADOUR',
]

const FAILED_OVERLAPS_SUGGESTION_THRESHOLD = 3

interface MuseWindow {
	start: number,
	end?: number | undefined,
}

interface BarrageOptions extends TrackedActionsOptions {
	barrageId: number
	wasBarrageUsed: (window: HistoryEntry<EvaluatedAction[]>) => boolean
}

class BarrageIronJawsEvaluator extends ExpectedActionsEvaluator {
	// Because this class is not an Analyser, it cannot use Data directly
	// to get the id for Barrage, so it has to take it in here.
	private barrageId: number
	private wasBarrageUsed: (window: HistoryEntry<EvaluatedAction[]>) => boolean

	constructor(opts: BarrageOptions) {
		super(opts)
		this.barrageId = opts.barrageId
		this.wasBarrageUsed = opts.wasBarrageUsed
	}

	override countUsed(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		if (action.action.id === this.barrageId) {
			return this.wasBarrageUsed(window) ? 1 : 0
		}
		return super.countUsed(window, action)
	}
}

export class BurstWindow extends BuffGroupWindow {
	static override handle = 'burst'
	static override title = t('brd.burst.title')`Burst Window`
	static override displayOrder = DISPLAY_ORDER.BURST_WINDOW

	@dependency private globalCooldown!: GlobalCooldown
	@dependency private actors!: Actors

	override buffStatus = [this.data.statuses.RAGING_STRIKES, this.data.statuses.RADIANT_FINALE, this.data.statuses.BATTLE_VOICE]

	private museHistory: MuseWindow[] = []
	private barrageRemoves: number[] = []

	private moduleLink = (
		<a style={{cursor: 'pointer'}} onClick={() => this.parser.scrollTo(BurstWindow.handle)}>
			<NormalisedMessage message={BurstWindow.title}/>
		</a>
	)

	override prependMessages = <Message icon>
		<Icon name="info" />
		<Message.Content>
			<Trans id="brd.burst.header.content">
				The rotation table below shows actions used while all three of <StatusLink status="RAGING_STRIKES"/>, <StatusLink status="BATTLE_VOICE"/> and <StatusLink status="RADIANT_FINALE"/> were present.
				<br/>
				The expected number of GCDs under the effect of all of your three buffs is 7 GCDs (8 GCDs with <DataLink status="ARMYS_MUSE"/>).
			</Trans>
		</Message.Content>
	</Message>

	override initialise() {
		super.initialise()

		this.ignoreActions(SUPPORT_ACTIONS.map(actionKey => this.data.actions[actionKey].id))

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const buffFilter = playerFilter.status(this.data.statuses.ARMYS_MUSE.id)
		this.addEventHook(buffFilter.type('statusApply'), this.onApplyMuse)
		this.addEventHook(buffFilter.type('statusRemove'), this.onRemoveMuse)
		this.addEventHook(playerFilter.status(this.data.statuses.BARRAGE.id).type('statusRemove'), this.onRemoveBarrage)

		const suggestionWindowName = <Trans id="brd.burst.suggestions.name">Burst</Trans>

		this.addEvaluator(new RequiredGcdCountEvaluator({
			requiredGcds: 7,
			hasStacks: false,
			globalCooldown: this.globalCooldown,
			suggestionIcon: this.data.actions.RAGING_STRIKES.icon,
			suggestionContent: <Trans id="brd.burst.suggestions.missedgcd.content">
				Try to land 7 GCDs (8 GCDs with <DataLink status="ARMYS_MUSE"/>) during every {suggestionWindowName} window.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustMuseGcdCount.bind(this),
			isRushed: this.isRushedEndOfPullWindow.bind(this),
		}))

		this.addEvaluator(new BarrageIronJawsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.BARRAGE,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.IRON_JAWS,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon: this.data.actions.BARRAGE.icon,
			suggestionContent: <Trans id="brd.burst.suggestions.trackedactions.content">
				One use of <DataLink action="BARRAGE"/> and one use of <DataLink action="IRON_JAWS"/> should occur during every {suggestionWindowName} window.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedBarrageIronJawsCount.bind(this),
			adjustOutcome: this.adjustExpectedIronJawsOutcome.bind(this),
			barrageId: this.data.actions.BARRAGE.id,
			wasBarrageUsed: this.wasBarrageUsed.bind(this),
		}))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.APEX_ARROW,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.BLAST_ARROW,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon: this.data.actions.BLAST_ARROW.icon,
			suggestionContent: <Trans id="brd.burst.suggestions.aaba-evaluator.content">
				One use of <DataLink action="APEX_ARROW"/> and <DataLink action="BLAST_ARROW"/> should occur during every {suggestionWindowName} window after the opener. Make sure you have at least 80 Soul Voice Gauge for your buffs.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedApexCount.bind(this),
		}))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.RADIANT_ENCORE,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.RESONANT_ARROW,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon: this.data.actions.RADIANT_ENCORE.icon,
			suggestionContent: <Trans id="brd.burst.suggestions.prio-gcds-evaluator.content">
				One use of <DataLink action="RADIANT_ENCORE"/> and <DataLink action="RESONANT_ARROW"/> should occur during every {suggestionWindowName} window.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedPrioGcdCount.bind(this),
		}))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.EMPYREAL_ARROW,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.SIDEWINDER,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon: this.data.actions.SIDEWINDER.icon,
			suggestionContent: <Trans id="brd.burst.suggestions.prio-ogcds-evaluator.content">
				One use of <DataLink action="SIDEWINDER"/> and at least one use of <DataLink action="EMPYREAL_ARROW"/> should occur during every {suggestionWindowName} window.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedOgcdCount.bind(this),
		}))

		this.addEvaluator(new ExpectedActionGroupsEvaluator({
			expectedActionGroups: [{
				actions: [this.data.actions.HEARTBREAK_SHOT, this.data.actions.RAIN_OF_DEATH],
				expectedPerWindow: 3,
			}],
			suggestionIcon: this.data.actions.HEARTBREAK_SHOT.icon,
			suggestionContent: <Trans id="brd.burst.suggestions.hbs-evaluator.content">
				At least three uses of <DataLink action="HEARTBREAK_SHOT"/> or <DataLink action="RAIN_OF_DEATH"/> should occur during every {suggestionWindowName} window. Make sure you pool your <DataLink action="HEARTBREAK_SHOT"/> or <DataLink action="RAIN_OF_DEATH"/> charges during <DataLink action="ARMYS_PAEON"/>.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedOgcdCount.bind(this),
		}))
	}

	private getFailedOverlapsSuggestion() {
		const failedOverlaps = this.failedOverlapStarts.length
		let severity: number

		if (failedOverlaps < FAILED_OVERLAPS_SUGGESTION_THRESHOLD) {
			severity = SEVERITY.MEDIUM
		} else {
			severity = SEVERITY.MAJOR
		}

		return new Suggestion({
			icon: this.data.actions.RADIANT_FINALE.icon,
			content: <Trans id="brd.burst.suggestions.failed-overlaps.content">
				Make sure your <DataLink action="RADIANT_FINALE"/>, <DataLink action="BATTLE_VOICE"/> and <DataLink action="RAGING_STRIKES"/> are properly aligned and overlapping. Buffs are multiplicative, and using them as close to each other as possible increases your damage output. Check the {this.moduleLink} module below for more detailed analysis.
			</Trans>,
			why: <Trans id="brd.burst.suggestions.failed-overlaps.why"><Plural value={failedOverlaps} one="# buff application wasn't" other="# buff applications weren't" /> properly aligned.</Trans>,
			severity,
		})
	}

	private getFailedOverlapsMessage() {
		return <Fragment>
			<Message>
				<Trans id="brd.burst.buffoverlap.content">
					The following buffs weren't properly aligned. Make sure you align your <StatusLink status="RAGING_STRIKES"/>, <StatusLink status="BATTLE_VOICE"/> and <StatusLink status="RADIANT_FINALE"/> to maximize the damage during your Burst Window.
				</Trans>
			</Message>
			<Table collapsing unstackable compact="very">
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell><Trans id="brd.burst.buffoverlap.timestamp-header">Timestamp</Trans></Table.HeaderCell>
						<Table.HeaderCell><Trans id="brd.burst.buffoverlap.buff-header">Buff</Trans></Table.HeaderCell>
						<Table.HeaderCell></Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{this.failedOverlapStarts.map(item => {
						return <Table.Row key={item.timestamp}>
							<Table.Cell>{this.parser.formatEpochTimestamp(item.timestamp)}</Table.Cell>
							<Table.Cell>
								<StatusLink {...this.data.getStatus(item.status)} />
							</Table.Cell>
							<Table.Cell>
								<Button onClick={() =>
									this.timeline.show(item.timestamp - this.parser.pull.timestamp, item.timestamp - this.parser.pull.timestamp)}>
									<Trans id="brd.burst.buffoverlap.timelinelink-button">Jump to Timeline</Trans>
								</Button>
							</Table.Cell>
						</Table.Row>
					})}
				</Table.Body>
			</Table>
		</Fragment>
	}

	protected override onComplete() {
		if (this.failedOverlapStarts.length > 0) {
			this.suggestions.add(this.getFailedOverlapsSuggestion())
			this.appendMessages = this.getFailedOverlapsMessage()
		}
		super.onComplete()
	}

	private get activeMuse(): MuseWindow | undefined {
		const last = _.last(this.museHistory)
		if (last && !isDefined(last.end)) {
			return last
		}
		return undefined
	}

	private onApplyMuse(event: Events['statusApply']) {
		this.museHistory.push({start: event.timestamp})
	}

	private onRemoveMuse(event: Events['statusRemove']) {
		if (this.activeMuse) {
			this.activeMuse.end = event.timestamp
		}
	}

	private onRemoveBarrage(event: Events['statusRemove']) {
		this.barrageRemoves.push(event.timestamp)
	}

	private adjustMuseGcdCount(window: HistoryEntry<EvaluatedAction[]>) {
		// Ignore muse if end of fight
		// TODO: better end of fight handling (can make it scale with % of GCDs in muse)
		if (this.isRushedEndOfPullWindow(window)) {
			return 0
		}

		// Check if muse was up for at least 3 GCDs in this buffWindow
		const museOverlap = this.museHistory.some(muse => (
			window.data.filter(event => this.data.getAction(event.action.id)?.onGcd &&
				event.timestamp > muse.start && (!muse.end || event.timestamp < muse.end))
				.length >= MIN_MUSE_GCDS
		))

		return museOverlap ? 1 : 0
	}

	private adjustExpectedOgcdCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction | TrackedActionGroup) {
		// TODO: better end of fight handling
		if (this.isRushedEndOfPullWindow(window)) {
			return action.expectedPerWindow * -1
		}
		return 0
	}

	private adjustExpectedBarrageIronJawsCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		/**
		 * IJ definitely shouldn't be used at the end of the fight, so reduce by 1
		 * Barrage might have floated to the end of the RS window, so reduce by 1
		 */
		// TODO: better end of fight handling (barrage mostly)
		if (this.isRushedEndOfPullWindow(window)) {
			return -1
		}

		// If the action was Iron Jaws, the upper limit = the number of enemies we cast something on during this RS window
		if (action.action !== this.data.actions.IRON_JAWS) {
			return 0
		}

		const enemyIDs = new Set<string>()
		window.data
			.filter(e => this.actors.get(e.target).team === Team.FOE)
			.forEach(e => enemyIDs.add(e.target))

		// Baseline number of allowed Iron Jaws is 1 and this function is an adjustment.
		return Math.max(enemyIDs.size - 1, 0)
	}

	private adjustExpectedIronJawsOutcome(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		/**
		 * Positive only if we had exactly one Iron Jaws in this RS
		 * If expected > 1, we're in AoE and there is no clear rotation target, so don't highlight this cell
		 */
		if (action.action === this.data.actions.IRON_JAWS) {
			return (actual: number, expected?: number) => {
				if (!isDefined(expected) || expected > 1) {
					return RotationTargetOutcome.NEUTRAL
				}

				if (actual === expected) {
					return RotationTargetOutcome.POSITIVE
				}

				return RotationTargetOutcome.NEGATIVE
			}
		}
	}

	private adjustExpectedApexCount(window: HistoryEntry<EvaluatedAction[]>) {
		// If the action is Apex Arrow or Blast Arrow, shouldn't count at the first window of the fight,
		// since there's no gauge to be spent
		if (window.start - APEX_OPENER_BUFFER <= this.parser.pull.timestamp) {
			return -1
		}

		// TODO: better end of fight handling
		if (this.isRushedEndOfPullWindow(window)) {
			return -1
		}

		return 0
	}

	private adjustExpectedPrioGcdCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		// TODO: better end of fight handling
		// If end of fight, make only Radiant Encore required assuming there's at least one GCD
		if (this.isRushedEndOfPullWindow(window)) {
			if (window.data.filter(it => it.action.onGcd).length > 0 && action.action !== this.data.actions.RADIANT_ENCORE) {
				return -1
			}
		}

		return 0
	}

	private wasBarrageUsed(window: HistoryEntry<EvaluatedAction[]>) {
		const gcdTimestamps = window.data
			.filter(event => event.action.id === this.data.actions.REFULGENT_ARROW.id || event.action.id === this.data.actions.SHADOWBITE.id)
			.map(event => event.timestamp)
		if (gcdTimestamps.length === 0) { return false }

		// Check to make sure at least one Refulgent Arrow or Shadowbite happened before the status expired
		const firstGcd = gcdTimestamps[0]
		return this.barrageRemoves.some(timestamp => firstGcd <= timestamp && timestamp <= (window.end ?? window.start))
	}
}
