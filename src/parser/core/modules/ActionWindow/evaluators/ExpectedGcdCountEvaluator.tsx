import {Plural, Trans} from '@lingui/react'
import React from 'react'
import {GlobalCooldown} from '../../GlobalCooldown'
import {SeverityTiers, TieredSuggestion} from '../../Suggestions/Suggestion'
import {EvaluatedAction} from '../EvaluatedAction'
import {HistoryEntry} from '../History'
import {EvaluationOutput, WindowEvaluator} from './WindowEvaluator'

// Extremely conservative weave delay to prevent
// any possibility of undercounting expected GCDs
const weaveDelay = 250

// exported for use in AllowedGcdsOnlyEvaluator
export function calculateExpectedGcdsForTime(defaultExpected: number, gcdEstimate: number, hasStacks: boolean, start: number, end?: number) {
	let usableWindow = (end ?? start) - start

	// Buffs with stacks have durations tightly coupled to the GCD
	// and do not benefit from accounting for weave delay
	if (!hasStacks)
		usableWindow -= weaveDelay

	usableWindow = Math.max(usableWindow, 1)

	return Math.min(defaultExpected, Math.ceil(usableWindow / gcdEstimate))
}

interface ExpectedGcdCountOptions {
	expectedGcds: number
	/**
	 * This should be the globalCooldown dependency object.
	 * It is used by this class to perform end of fight gcd count adjustment.
	 */
	globalCooldown: GlobalCooldown
	hasStacks: boolean
	suggestionIcon: string
	suggestionContent: JSX.Element
	/**
	 * This is the name of the window used in the why portion of suggestions generated by these evaluators.
	 * A DataLink with showIcon={false} or a Trans tag with an alternate name is recommended.
	 */
	suggestionWindowName: JSX.Element
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
	private hasStacks: boolean
	private suggestionIcon: string
	private suggestionContent: JSX.Element
	private suggestionWindowName: JSX.Element
	private severityTiers: SeverityTiers
	private adjustCount: (window: HistoryEntry<EvaluatedAction[]>) => number

	constructor(opts: ExpectedGcdCountOptions) {
		this.expectedGcds = opts.expectedGcds
		this.globalCooldown = opts.globalCooldown
		this.hasStacks = opts.hasStacks
		this.suggestionIcon = opts.suggestionIcon
		this.suggestionContent = opts.suggestionContent
		this.suggestionWindowName = opts.suggestionWindowName
		this.severityTiers = opts.severityTiers
		this.adjustCount = opts.adjustCount ?? (() => 0)
	}

	public suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const missedGCDs = windows.reduce((acc, window) => acc + this.calculateMissingGcdsForWindow(window), 0)

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: this.suggestionContent,
			tiers: this.severityTiers,
			value: missedGCDs,
			why: <Trans id="core.buffwindow.suggestions.missedgcd.why">
				<Plural value={missedGCDs} one="# GCD was" other="# GCDs were" /> missed during {this.suggestionWindowName} windows.
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
			rows: windows.map(window => {
				return {
					actual: this.countGcdsInWindow(window),
					expected: this.calculateExpectedGcdsForWindow(window),
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
		return calculateExpectedGcdsForTime(this.expectedGcds, this.globalCooldown.getDuration(), this.hasStacks, window.start, window.end) + this.adjustCount(window)
	}

	private countGcdsInWindow(window: HistoryEntry<EvaluatedAction[]>) {
		return window.data.filter(cast => cast.action.onGcd).length
	}

}
