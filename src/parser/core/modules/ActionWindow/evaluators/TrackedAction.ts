import {RotationTargetOutcome} from 'components/ui/RotationTable'
import {Action} from 'data/ACTIONS'
import {HistoryEntry} from '../../History'
import {SeverityTiers} from '../../Suggestions/Suggestion'
import {EvaluatedAction} from '../EvaluatedAction'

export type OutcomeCalculator = (actual: number, expected?: number) => RotationTargetOutcome

/**
 * Defines an action to be tracked by an evaluator.
 * All actions are allowed, GCD or otherwise.
 */
export interface TrackedAction {
	/**
	 * The action to track.
	 */
	action: Action
	/**
	 * The number of uses expected per window.
	 * This may be a minimum or maximum depending on the evaluator.
	 */
	expectedPerWindow: number
}

/**
 * Constructor options class for evaluators that track actions with an
 * expected use count per window.
 */
export interface TrackedActionsOptions {
	expectedActions: TrackedAction[]
	suggestionIcon: string
	suggestionContent: JSX.Element
	windowName: string
	severityTiers: SeverityTiers
	/**
	 * This method MAY be provided to adjust the expected number of uses of a tracked action within a given window.
	 * This method IS responsible for calculating ALL reductions INCLUDING due to end of fight rushing.
	 * @param window The window for which the expected tracked action count will be adjusted
	 * @param action The action whose count will be adjusted
	 * @returns An adjustment to add to the expected count. A positive number INCREASES the
	 * number of expected uses; a negative number DECREASES the number of expected uses.
	 */
	adjustCount?: (window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) => number
	/**
	 * This method MAY be provided to adjust the highlighting outcome of an evaluation for a tracked action within a given window.
	 * @param buffWindow The window for which the tracked action outcome will be adjusted
	 * @param action The action whose outcome will be adjusted
	 * @returns A function that takes actual and expected uses and return the adjusted RotationTargetOutcome or
	 * undefined to use the default logic for this window and action combination.
	 */
	adjustOutcome?: (window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) => OutcomeCalculator | undefined
}
