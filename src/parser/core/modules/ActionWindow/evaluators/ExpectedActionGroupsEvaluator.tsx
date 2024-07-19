import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTargetOutcome} from 'components/ui/RotationTable'
import _ from 'lodash'
import React from 'react'
import {SeverityTiers, TieredSuggestion} from '../../Suggestions/Suggestion'
import {EvaluatedAction} from '../EvaluatedAction'
import {HistoryEntry} from '../History'
import {OutcomeCalculator} from './TrackedAction'
import {TrackedActionGroup, TrackedActionGroupsOptions} from './TrackedActionGroup'
import {EvaluationOutput, WindowEvaluator} from './WindowEvaluator'

export class ExpectedActionGroupsEvaluator implements WindowEvaluator {

	private expectedActionGroups: TrackedActionGroup[]
	private suggestionIcon: string
	private suggestionContent: JSX.Element
	private suggestionWindowName: JSX.Element
	private severityTiers: SeverityTiers
	private adjustCount : (window: HistoryEntry<EvaluatedAction[]>, action: TrackedActionGroup) => number
	private adjustOutcome : (window: HistoryEntry<EvaluatedAction[]>, action: TrackedActionGroup) => OutcomeCalculator | undefined

	constructor(opts: TrackedActionGroupsOptions) {
		this.expectedActionGroups = opts.expectedActionGroups
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
				const missingInWindow = this.expectedActionGroups.reduce((subTotal, actionGroup) => {
					const actual = this.countUsed(window, actionGroup)
					const expected = this.determineExpected(window, actionGroup)
					const comparator = this.adjustOutcome(window, actionGroup)
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

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput[]  {
		return this.expectedActionGroups.map(actionGroup => {
			const header = (actionGroup.overrideHeader != null ?
				<><ActionLink showName={false} {...actionGroup.overrideHeader}/></>
				: actionGroup.actions.map((action, i) => {
					return <>
						{ i > 0 && <> / </> }
						<ActionLink key={i} showName={false} {...action}/>
					</>
				})
			)

			return {
				format: 'table',
				header: {
					header: header,
					accessor: _.first(actionGroup.actions)?.name ?? '',
				},
				rows: windows.map(window => {
					return {
						actual: this.countUsed(window, actionGroup),
						expected: this.determineExpected(window, actionGroup),
						targetComparator: this.adjustOutcome(window, actionGroup),
					}
				}),
			}
		})
	}

	protected countUsed(window: HistoryEntry<EvaluatedAction[]>, actionGroup: TrackedActionGroup) {
		return window.data.filter(cast => {
			for (const action of actionGroup.actions) {
				if (cast.action.id === action.id) { return true }
			}
			return false
		}).length
	}

	private determineExpected(window: HistoryEntry<EvaluatedAction[]>, action: TrackedActionGroup) {
		return action.expectedPerWindow + this.adjustCount(window, action)
	}
}
