import {Plural, Trans} from '@lingui/react'
import React from 'react'
import {GlobalCooldown} from '../../GlobalCooldown'
import {HistoryEntry} from '../../History'
import {SeverityTiers, TieredSuggestion} from '../../Suggestions/Suggestion'
import {EvaluatedAction} from '../EvaluatedAction'
import {calculateExpectedGcdsForTime} from './ExpectedGcdCountEvaluator'
import {EvaluationOutput, WindowEvaluator} from './WindowEvaluator'

interface AllowedGcdsOnlyOptions {
	expectedGcdCount: number
	allowedGcds: number[]
	/**
	 * This should be the globalCooldown dependency object.
	 * It is used by this class to perform end of fight gcd count adjustment.
	 */
	globalCooldown: GlobalCooldown
	suggestionIcon: string
	suggestionContent: JSX.Element
	windowName: string
	severityTiers: SeverityTiers
	/**
	 * This method MAY be provided to adjust the default number of expected GCDs, as calculated based on
	 * the provided baseline and window duration.
	 * This method is NOT responsible for calculating reductions due to end of fight rushing.
	 * @param window The window for which the expected GCD count will be adjusted
	 * @returns An adjustment to add to the baseline expected GCD count. A positive number INCREASES the
	 * number of expected GCDs; a negative number DECREASES the number of expected GCDs
	 */
	adjustCount?: (window: HistoryEntry<EvaluatedAction[]>) => number
}
/**
 * Checks if all GCDs in a window are one of the allowed GCDs.
 * This should be used for windows that contain repeated use of only few GCDs,
 * such as DRK's Delirium.  Use ExpectedActionsEvaluator instead for something
 * like PLD's Requiescat window that requires specific numbers of different GCDs.
 */
export class AllowedGcdsOnlyEvaluator implements WindowEvaluator {

	private expectedGcdCount: number
	private allowedGcds: number[]
	private globalCooldown: GlobalCooldown
	private suggestionIcon: string
	private suggestionContent: JSX.Element
	private windowName: string
	private severityTiers: SeverityTiers
	private adjustCount: (window: HistoryEntry<EvaluatedAction[]>) => number

	constructor(opts: AllowedGcdsOnlyOptions) {
		this.expectedGcdCount = opts.expectedGcdCount
		this.allowedGcds = opts.allowedGcds
		this.globalCooldown = opts.globalCooldown
		this.suggestionIcon = opts.suggestionIcon
		this.suggestionContent = opts.suggestionContent
		this.windowName = opts.windowName
		this.severityTiers = opts.severityTiers
		this.adjustCount = opts.adjustCount ?? (() => 0)
	}

	// This calculation method is brought in from BuffWindow and is done this way because the
	// table output lists x/y in a column to show that <required skill> was used x times out of the
	// expected y times (the possible number of gcds) in a given window.
	public suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const invalidGCDs = windows.reduce((acc, w) => acc + this.calculateBadGcdsForWindow(w), 0)

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: this.suggestionContent,
			tiers: this.severityTiers,
			value: invalidGCDs,
			why: <Trans id="core.buffwindow.suggestions.badgcd.why">
				<Plural value={invalidGCDs} one="# incorrect GCD was" other="# incorrect GCDs were" /> used during {this.windowName} windows.
			</Trans>,
		})
	}

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput  {
		return {
			format: 'table',
			header: {
				header: <img src={this.suggestionIcon} alt="" style={{height: '20px'}}/>,
				accessor: 'badgcd',
			},
			rows: windows.map(w => {
				return {
					actual: this.countAllowedGcdsInWindow(w),
					expected: this.calculateExpectedGcdsForWindow(w),
				}
			}),
		}
	}

	private calculateBadGcdsForWindow(window: HistoryEntry<EvaluatedAction[]>) {
		return window.data.filter(ta => ta.action.onGcd && !this.allowedGcds.includes(ta.action.id)).length
	}

	private calculateExpectedGcdsForWindow(window: HistoryEntry<EvaluatedAction[]>) {
		return calculateExpectedGcdsForTime(this.expectedGcdCount, this.globalCooldown.getEstimate(), window.start, window.end) + this.adjustCount(window)
	}

	private countAllowedGcdsInWindow(window: HistoryEntry<EvaluatedAction[]>) {
		return window.data.filter(ta => ta.action.onGcd && this.allowedGcds.includes(ta.action.id)).length
	}

}
