import {Plural, Trans} from '@lingui/react'
import React from 'react'
import {GlobalCooldown} from '../../GlobalCooldown'
import {HistoryEntry} from '../../History'
import {SeverityTiers, TieredSuggestion} from '../../Suggestions/Suggestion'
import {EvaluatedAction} from '../EvaluatedAction'
import {EvaluationOutput, WindowEvaluator} from './WindowEvaluator'

// exported for use in AllowedGcdsOnlyEvaluator
export function calculateExpectedGcdsForTime(defaultExpected: number, gcdEstimate: number, start: number, end?: number) {
	return Math.min(defaultExpected, Math.ceil(((end ?? start) - start) / gcdEstimate))
}

interface ExpectedGcdCountOptions {
	expectedGcds: number
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
 * Checks if a window contains the maximum possible number of GCDs based on the estimated GCD speed.
 * All GCDs used in the window will be counted towards the total.
 */
export class ExpectedGcdCountEvaluator implements WindowEvaluator {

	private expectedGcds: number
	private globalCooldown: GlobalCooldown
	private suggestionIcon: string
	private suggestionContent: JSX.Element
	private windowName: string
	private severityTiers: SeverityTiers
	private adjustCount: (window: HistoryEntry<EvaluatedAction[]>) => number

	constructor(opts: ExpectedGcdCountOptions) {
		this.expectedGcds = opts.expectedGcds
		this.globalCooldown = opts.globalCooldown
		this.suggestionIcon = opts.suggestionIcon
		this.suggestionContent = opts.suggestionContent
		this.windowName = opts.windowName
		this.severityTiers = opts.severityTiers
		this.adjustCount = opts.adjustCount ?? (() => 0)
	}

	public suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const missedGCDs = windows.reduce((acc, w) => acc + this.calculateMissingGcdsForWindow(w), 0)

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: this.suggestionContent,
			tiers: this.severityTiers,
			value: missedGCDs,
			why: <Trans id="core.buffwindow.suggestions.missedgcd.why">
				<Plural value={missedGCDs} one="# GCD was" other="# GCDs were" /> missed during {this.windowName} windows.
			</Trans>,
		})
	}

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput  {
		return {
			format: 'table',
			header: {
				header: <Trans id="core.buffwindow.table.header.gcds">GCDs</Trans>,
				accessor: 'missedgcd',
			},
			rows: windows.map(w => {
				return {
					actual: this.countGcdsInWindow(w),
					expected: this.calculateExpectedGcdsForWindow(w),
				}
			}),
		}
	}

	private calculateMissingGcdsForWindow(window: HistoryEntry<EvaluatedAction[]>) {
		const expected = this.calculateExpectedGcdsForWindow(window)
		const actual = this.countGcdsInWindow(window)
		return Math.max(0, expected - actual)
	}

	private calculateExpectedGcdsForWindow(window: HistoryEntry<EvaluatedAction[]>) {
		return calculateExpectedGcdsForTime(this.expectedGcds, this.globalCooldown.getEstimate(), window.start, window.end) + this.adjustCount(window)
	}

	private countGcdsInWindow(window: HistoryEntry<EvaluatedAction[]>) {
		return window.data.filter(ta => ta.action.onGcd).length
	}

}
