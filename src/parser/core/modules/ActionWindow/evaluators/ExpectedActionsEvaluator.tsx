import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTargetOutcome} from 'components/ui/RotationTable'
import React from 'react'
import {HistoryEntry} from '../../History'
import {SeverityTiers, TieredSuggestion} from '../../Suggestions/Suggestion'
import {EvaluatedAction} from '../EvaluatedAction'
import {OutcomeCalculator, TrackedAction, TrackedActionsOptions} from './TrackedAction'
import {EvaluationOutput, WindowEvaluator} from './WindowEvaluator'

/**
 * Checks if specific actions are used a minimum number of times in a window.
 */
export class ExpectedActionsEvaluator implements WindowEvaluator {

	private expectedActions: TrackedAction[]
	private suggestionIcon: string
	private suggestionContent: JSX.Element
	private windowName: string
	private severityTiers: SeverityTiers
	private adjustCount : (window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) => number
	private adjustOutcome : (window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) => OutcomeCalculator | undefined

	constructor(opts: TrackedActionsOptions) {
		this.expectedActions = opts.expectedActions
		this.suggestionIcon = opts.suggestionIcon
		this.suggestionContent = opts.suggestionContent
		this.windowName = opts.windowName
		this.severityTiers = opts.severityTiers
		this.adjustCount = opts.adjustCount ?? (() => 0)
		this.adjustOutcome = opts.adjustOutcome ?? (() => undefined)
	}

	public suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const missedCount = windows
			.reduce((total, w) => {
				const missingInWindow = this.expectedActions.reduce((subTotal, action) => {
					const actual = this.countUsed(w, action)
					const expected = this.determineExpected(w, action)
					const comparator = this.adjustOutcome(w, action)
					// If a custom comparator is defined for this action, and it didn't return negative, don't count this window
					const currentLoss = (comparator != null && comparator(actual, expected) !== RotationTargetOutcome.NEGATIVE) ?
						0 : Math.max(0, expected - actual)
					return subTotal + currentLoss
				}, 0)
				return total + missingInWindow
			}, 0)

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: this.suggestionContent,
			tiers: this.severityTiers,
			value: missedCount,
			why: <Trans id="core.buffwindow.suggestions.trackedaction.why">
				<Plural value={missedCount} one="# use of a recommended action was" other="# uses of recommended actions were"/> missed during {this.windowName} windows.
			</Trans>,
		})
	}

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput[]  {
		return this.expectedActions.map(ea => {
			return {
				format: 'table',
				header: {
					header: <ActionLink showName={false} {...ea.action}/>,
					accessor: ea.action.name,
				},
				rows: windows.map(w => {
					return {
						actual: this.countUsed(w, ea),
						expected: this.determineExpected(w, ea),
						targetComparator: this.adjustOutcome(w, ea),
					}
				}),
			}
		})
	}

	protected countUsed(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		return window.data.filter(ta => ta.action.id === action.action.id).length
	}

	private determineExpected(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		return action.expectedPerWindow + this.adjustCount(window, action)
	}
}
