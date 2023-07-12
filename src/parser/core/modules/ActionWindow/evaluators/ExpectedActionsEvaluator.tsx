import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTargetOutcome} from 'components/ui/RotationTable'
import React from 'react'
import {SeverityTiers, TieredSuggestion} from '../../Suggestions/Suggestion'
import {EvaluatedAction} from '../EvaluatedAction'
import {HistoryEntry} from '../History'
import {OutcomeCalculator, TrackedAction, TrackedActionsOptions} from './TrackedAction'
import {EvaluationOutput, WindowEvaluator} from './WindowEvaluator'

/**
 * Checks if specific actions are used a minimum number of times in a window.
 */
export class ExpectedActionsEvaluator implements WindowEvaluator {

	private expectedActions: TrackedAction[]
	private suggestionIcon: string
	private suggestionContent: JSX.Element
	private suggestionWindowName: JSX.Element
	private severityTiers: SeverityTiers
	private adjustCount : (window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) => number
	private adjustOutcome : (window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) => OutcomeCalculator | undefined

	constructor(opts: TrackedActionsOptions) {
		this.expectedActions = opts.expectedActions
		this.suggestionIcon = opts.suggestionIcon
		this.suggestionContent = opts.suggestionContent
		this.suggestionWindowName = opts.suggestionWindowName
		this.severityTiers = opts.severityTiers
		this.adjustCount = opts.adjustCount ?? (() => 0)
		this.adjustOutcome = opts.adjustOutcome ?? (() => undefined)
	}

	public suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const missedActions = windows
			.reduce((total, window) => {
				const missingInWindow = this.expectedActions.reduce((subTotal, action) => {
					const actual = this.countUsed(window, action)
					const expected = this.determineExpected(window, action)
					const comparator = this.adjustOutcome(window, action)
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
			value: missedActions,
			why: <Trans id="core.buffwindow.suggestions.trackedaction.why">
				<Plural value={missedActions} one="# use of a recommended action was" other="# uses of recommended actions were"/> missed during {this.suggestionWindowName} windows.
			</Trans>,
		})
	}

	protected actionHeader(action: TrackedAction) {
		return <ActionLink showName={false} {...action.action}/>
	}

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput[]  {
		return this.expectedActions.map(action => {
			return {
				format: 'table',
				header: {
					header: this.actionHeader(action),
					accessor: action.action.name,
				},
				rows: windows.map(window => {
					return {
						actual: this.countUsed(window, action),
						expected: this.determineExpected(window, action),
						targetComparator: this.adjustOutcome(window, action),
					}
				}),
			}
		})
	}

	protected countUsed(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		return window.data.filter(cast => cast.action.id === action.action.id).length
	}

	private determineExpected(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		return action.expectedPerWindow + this.adjustCount(window, action)
	}
}
