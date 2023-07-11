import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import _ from 'lodash'
import {EvaluatedAction, EvaluationOutput, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

/**
 * We leave space for roughly 4 GCDs at the end of the window when
 * determining whether or not a RoF window could have contained
 * another masterful blitz usage (3 PB GCDs + 1 MB GCD)
 */
const END_OF_WINDOW_TOLERANCE = 8000

// Assuming a roughly six minute kill time a standard rotation would
// have 11 blitz usages, arbitrarily marking missing more than half of
// those as a major issue with rotation execution.
const BLITZ_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	6: SEVERITY.MAJOR,
}

interface BlitzEvaluatorOpts {
	blitzActions: Array<Action['id']>,
	pbCasts: number[]
	blitzIcon: string
	pb: {cooldown: number, charges: number}
}

interface BlitzWindowResults {
	expected: number
	actual: number
}
export class BlitzEvaluator implements WindowEvaluator {
	private blitzActions: Array<Action['id']>
	private pbCasts: number[]
	private pbCooldown: number
	private pbCharges: number
	private blitzIcon: string

	private rechargeTimes: number[]
	private windowResults: BlitzWindowResults[]

	constructor(opts: BlitzEvaluatorOpts) {
		this.blitzActions = opts.blitzActions
		this.pbCasts = opts.pbCasts
		this.blitzIcon = opts.blitzIcon
		this.pbCooldown = opts.pb.cooldown
		this.pbCharges = opts.pb.charges

		this.rechargeTimes = []
		this.windowResults = []
	}

	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>): Suggestion {
		this.calculateWindowStats(windows)
		const badWindows = this.windowResults.filter(res => res.actual < res.expected)
		const missedBlitzes = _.sumBy(badWindows, res => res.expected - res.actual)

		return new TieredSuggestion({
			icon: this.blitzIcon,
			content: <Trans id="mnk.rof.suggestions.blitz.content">
				Try to hit two uses of <DataLink action="MASTERFUL_BLITZ"/> in both the opener and every 'even' <DataLink action="RIDDLE_OF_FIRE"/> window and one usage of <DataLink action="MASTERFUL_BLITZ"/> in every 'odd' window, as the blitz actions are your strongest skills.
			</Trans>,
			tiers: BLITZ_SEVERITY_TIERS,
			value: missedBlitzes,
			why: <Trans id="mnk.rof.suggestions.blitz.why">
				<Plural value={missedBlitzes} one="# use of" other="# uses of"/> <DataLink action="MASTERFUL_BLITZ"/> <Plural value={missedBlitzes} one="was" other="were"/> missed during {badWindows.length} <DataLink action="RIDDLE_OF_FIRE"/> <Plural value={badWindows.length} one ="window" other="windows"/>
			</Trans>,
		})
	}

	output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput {
		this.calculateWindowStats(windows)
		return {
			format: 'table',
			header: {
				header: <DataLink showName={false} action="MASTERFUL_BLITZ"/>,
				accessor: 'masterfulblitz',
			},
			rows: this.windowResults,
		}
	}

	private calculateWindowStats(windows: Array<HistoryEntry<EvaluatedAction[]>>): void {
		if (this.windowResults.length === windows.length) {
			return
		}

		this.calculateRechargeTimes()
		this.windowResults = windows.map(window => {
			return {
				actual: this.countBlitzes(window),
				expected: this.expectedBlitzes(window),
			}
		})
	}

	private calculateRechargeTimes(): void {
		let isOnCooldown = false
		for (let i = 0; i < this.pbCasts.length; i++) {
			if (i !== 0) {
				isOnCooldown = this.pbCasts[i] < this.rechargeTimes[i-1]
			}

			if (!isOnCooldown) {
				this.rechargeTimes[i] = this.pbCasts[i] + this.pbCooldown
			} else {
				this.rechargeTimes[i] = this.rechargeTimes[i-1] + this.pbCooldown
			}
		}
	}

	private countBlitzes(window: HistoryEntry<EvaluatedAction[]>): number {
		return window.data.filter(value => this.blitzActions.includes(value.action.id)).length
	}

	private expectedBlitzes(window: HistoryEntry<EvaluatedAction[]>): number {
		const priorCasts = this.pbCasts.filter(time => time <= window.start)
		const priorRegens = this.rechargeTimes.filter(time =>
			time <= (window.end ?? window.start) - END_OF_WINDOW_TOLERANCE
		)

		const castsAvailable = this.pbCharges - Math.min(this.pbCharges, priorCasts.length - priorRegens.length)

		// Even though it is possible to have a triple blitz window
		// we do not recommend it as a target since it is an advanced
		// optimization that requires specific types of downtime
		return Math.min(this.pbCharges, castsAvailable)
	}
}
