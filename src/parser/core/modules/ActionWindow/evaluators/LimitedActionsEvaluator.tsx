import {Plural, Trans} from '@lingui/react'
import React from 'react'
import {SeverityTiers, TieredSuggestion} from '../../Suggestions/Suggestion'
import {EvaluatedAction} from '../EvaluatedAction'
import {HistoryEntry} from '../History'
import {TrackedAction, TrackedActionsOptions} from './TrackedAction'
import {WindowEvaluator} from './WindowEvaluator'

/**
 * Checks if specific actions are used a maximum number of times in a window.
 * To check that an action is never used, set the expectedPerWindow to 0 for
 * that action.
 */
export class LimitedActionsEvaluator implements WindowEvaluator {

	private expectedActions: TrackedAction[]
	private suggestionIcon: string
	private suggestionContent: JSX.Element
	private suggestionWindowName: JSX.Element
	private severityTiers: SeverityTiers
	private adjustCount : (window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) => number

	constructor(opts: TrackedActionsOptions) {
		this.expectedActions = opts.expectedActions
		this.suggestionIcon = opts.suggestionIcon
		this.suggestionContent = opts.suggestionContent
		this.suggestionWindowName = opts.suggestionWindowName
		this.severityTiers = opts.severityTiers
		this.adjustCount = opts.adjustCount ?? (() => 0)
	}

	public suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const badActions = windows
			.reduce((total, window) => {
				const missingInWindow = this.expectedActions.reduce((subTotal, action) => {
					return subTotal + Math.max(0, this.countUsed(window, action) - (action.expectedPerWindow + this.adjustCount(window, action)))
				}, 0)
				return total + missingInWindow
			}, 0)

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: this.suggestionContent,
			tiers: this.severityTiers,
			value: badActions,
			why: <Trans id="core.buffwindow.suggestions.trackedbadaction.why">
				<Plural value={badActions} one="# use of" other="# uses of"/> actions that should be avoided during {this.suggestionWindowName} windows.
			</Trans>,
		})
	}

	public output(): undefined { return undefined }

	private countUsed(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		return window.data.filter(cast => cast.action.id === action.action.id).length
	}

}
