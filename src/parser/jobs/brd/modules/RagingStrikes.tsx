import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {RotationTargetOutcome} from 'components/ui/RotationTable'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import _ from 'lodash'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {
	BuffWindow,
	EvaluatedAction,
	EvaluationOutput,
	ExpectedActionsEvaluator,
	ExpectedGcdCountEvaluator,
	TrackedAction,
	TrackedActionsOptions, WindowEvaluator,
} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Actors} from 'parser/core/modules/Actors'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {SeverityTiers, TieredSuggestion} from 'parser/core/modules/Suggestions/Suggestion'
import React, {ReactNode} from 'react'
import {Team} from 'report'
import {Icon} from 'semantic-ui-react'
import {isDefined} from 'utilities'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// Minimum muse GCDs needed to expect an RS window to have 9 GCDs
const MIN_MUSE_GCDS = 3

const BUFF_BEST_USED_BEFORE_GCD = 3

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

interface MuseWindow {
	start: number,
	end?: number | undefined,
}

interface BarrageOptions extends TrackedActionsOptions {
	barrageId: number
	wasBarrageUsed: (window: HistoryEntry<EvaluatedAction[]>) => boolean
}

class BarrageEvaluator extends ExpectedActionsEvaluator {
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

interface BuffEvaluatorOptions {
	actions: ActionKey[]
	predicate: (action: ActionKey, bestBeforeGCD: number, window: HistoryEntry<EvaluatedAction[]>) => boolean

	suggestionIcon: string
	severityTiers: SeverityTiers
}

class BuffEvaluator implements WindowEvaluator, BuffEvaluatorOptions {
	actions: ActionKey[]
	predicate: (action: ActionKey, bestBeforeGCD: number, window: HistoryEntry<EvaluatedAction[]>) => boolean

	suggestionIcon: string
	suggestionWhy: ReactNode
	severityTiers: SeverityTiers

	constructor(opt: BuffEvaluatorOptions) {
		this.actions = opt.actions
		this.predicate = opt.predicate
		this.suggestionIcon = opt.suggestionIcon
		this.severityTiers = opt.severityTiers
	}

	output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput[] {
		return this.actions.map(it => {
			const header = {
				header: <Trans id="brd.rs.rotation-table.header.on-time"><DataLink showName={false} action={it} /> On Time?</Trans>,
				accessor: String(it),
			}

			return {
				format: 'notes',
				header: header,
				rows: windows.map(window => this.generateNotes(it, window)),
			}
		})
	}

	generateNotes(action: ActionKey, window: HistoryEntry<EvaluatedAction[]>) {
		const usedInTime = this.predicate(action, BUFF_BEST_USED_BEFORE_GCD, window)
		return <Icon
			name={usedInTime ? 'checkmark' : 'remove'}
			className={usedInTime ? 'text-success' : 'text-error'}
		/>
	}

	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const wrongUsages = this.actions.map(action =>
			// For each action, counts the amount of times skill was not used in time in every window
			windows.map(window => Number(!this.predicate(action, BUFF_BEST_USED_BEFORE_GCD, window)))
				.reduce((acc, it) => acc + it, 0)
		).reduce((acc, it) => acc + it, 0)

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: <Trans id="brd.rs.suggestions.buff-evaluator.content">
				Using <DataLink action="RADIANT_FINALE" /> and <DataLink action="BATTLE_VOICE" /> within the first two GCDs of <DataLink action="RAGING_STRIKES" /> windows allows you to better align their duration and maximize the multiplicative bonuses these statuses give you.
			</Trans>,
			tiers: this.severityTiers,
			value: wrongUsages,
			why: <Trans id="brd.rs.suggestions.buff-evaluator.why">
				<Plural value={wrongUsages} one="# cast of Battle Voice or Radiant Finale was" other="# casts of Battle Voice or Radiant Finale were"/> used later than optimal, or not at all.
			</Trans>,
		})
	}
}

export class RagingStrikes extends BuffWindow {
	static override handle = 'rs'
	static override title = t('brd.rs.title')`Raging Strikes`
	static override displayOrder = DISPLAY_ORDER.RAGING_STRIKES

	@dependency private globalCooldown!: GlobalCooldown
	@dependency private actors!: Actors

	override buffStatus = this.data.statuses.RAGING_STRIKES

	private museHistory: MuseWindow[] = []
	private barrageRemoves: number[] = []

	override initialise() {
		super.initialise()

		this.ignoreActions(SUPPORT_ACTIONS.map(actionKey => this.data.actions[actionKey].id))

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const buffFilter = playerFilter.status(this.data.statuses.ARMYS_MUSE.id)
		this.addEventHook(buffFilter.type('statusApply'), this.onApplyMuse)
		this.addEventHook(buffFilter.type('statusRemove'), this.onRemoveMuse)
		this.addEventHook(playerFilter.status(this.data.statuses.BARRAGE.id).type('statusRemove'), this.onRemoveBarrage)

		const suggestionWindowName = <DataLink action="RAGING_STRIKES" showIcon={false} />
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 8,
			globalCooldown: this.globalCooldown,
			suggestionIcon: this.data.actions.RAGING_STRIKES.icon,
			suggestionContent: <Trans id="brd.rs.suggestions.missedgcd.content">
				Try to land 8 GCDs (9 GCDs with <DataLink status="ARMYS_MUSE"/>) during every <DataLink action="RAGING_STRIKES"/> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedGcdCount.bind(this),
		}))

		this.addEvaluator(new BarrageEvaluator({
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
			suggestionContent: <Trans id="brd.rs.suggestions.trackedactions.content">
				One use of <DataLink action="BARRAGE"/> and one use of <DataLink action="IRON_JAWS"/> should occur during every <DataLink action="RAGING_STRIKES"/> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedActionCount.bind(this),
			adjustOutcome: this.adjustExpectedActionOutcome.bind(this),
			barrageId: this.data.actions.BARRAGE.id,
			wasBarrageUsed: this.wasBarrageUsed.bind(this),
		}))

		this.addEvaluator(new BuffEvaluator({
			actions: ['BATTLE_VOICE', 'RADIANT_FINALE'],
			predicate: this.wasActionUsedInTime,
			suggestionIcon: this.data.actions.RADIANT_FINALE.icon,
			severityTiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
		}))
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

	private adjustExpectedGcdCount(window: HistoryEntry<EvaluatedAction[]>) {
		// Check if muse was up for at least 3 GCDs in this buffWindow
		const museOverlap = this.museHistory.some(muse => (
			window.data.filter(event => this.data.getAction(event.action.id)?.onGcd &&
					event.timestamp > muse.start && (!muse.end || event.timestamp < muse.end))
				.length >= MIN_MUSE_GCDS
		))

		return museOverlap ? 1 : 0
	}

	private adjustExpectedActionCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		/**
		 * IJ definitely shouldn't be used at the end of the fight, so reduce by 1
		 * Barrage might have floated to the end of the RS window, so reduce by 1
		 */
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

	private adjustExpectedActionOutcome(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
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

	private wasBarrageUsed(window: HistoryEntry<EvaluatedAction[]>) {
		const gcdTimestamps = window.data
			.filter(event => event.action.onGcd)
			.map(event => event.timestamp)
		if (gcdTimestamps.length === 0) { return false }

		// Check to make sure at least one GCD happened before the status expired
		const firstGcd = gcdTimestamps[0]
		return this.barrageRemoves.some(timestamp => firstGcd <= timestamp && timestamp <= (window.end ?? window.start))
	}

	private wasActionUsedInTime = (action: ActionKey, bestBeforeGCD: number, window: HistoryEntry<EvaluatedAction[]>): boolean => {
		const buffAction = _.first(window.data.filter(it => it.action.id === this.data.actions[action].id))

		// Buff was not used, thus it was not in time
		if (buffAction === undefined) { return false }

		const gcdThreshold = _.last(
			window.data
				.filter(it => it.action.onGcd)
				.slice(0, bestBeforeGCD)
		)

		// There's no limiting GCD in the window, so can only assume it was used in time
		if (gcdThreshold === undefined) { return true }

		// Used in time if it was used before specified GCD
		return buffAction.timestamp < gcdThreshold.timestamp
	}
}
