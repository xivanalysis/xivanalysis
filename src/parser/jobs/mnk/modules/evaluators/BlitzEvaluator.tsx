import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {EvaluatedAction, EvaluationOutput, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import React from 'react'

/**
 * We leave space for roughly 4 GCDs at the end of the window when
 * determining whether or not a RoF window could have contained
 * another masterful blitz usage (3 PB GCDs + 1 MB GCD)
 */
const END_OF_WINDOW_TOLERANCE = 8000

const MAX_POOLED_PB = 2

interface BlitzEvaluatorOpts {
	blitzActions: Array<Action['id']>,
	pbCasts: number[]
	pbCooldown: number
}

export class BlitzEvaluator implements WindowEvaluator {
	private blitzActions: Array<Action['id']>
	private pbCasts: number[]
	private regenTimes: number[] = []
	private pbCooldown: number

	constructor(opts: BlitzEvaluatorOpts) {
		this.blitzActions = opts.blitzActions
		this.pbCasts = opts.pbCasts
		this.pbCooldown = opts.pbCooldown
	}

	suggest() {
		return undefined
	}

	output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput {
		this.calculateRegenTimes()
		return {
			format: 'table',
			header: {
				header: <DataLink showName={false} action="MASTERFUL_BLITZ"/>,
				accessor: 'masterfulblitz',
			},
			rows: windows.map(window => {
				return {
					actual: this.countBlitzes(window),
					expected: this.expectedBlitzes(window),
				}
			}),
		}
	}

	private countBlitzes(window: HistoryEntry<EvaluatedAction[]>): number {
		return window.data.filter(value => this.blitzActions.includes(value.action.id)).length
	}

	private calculateRegenTimes(): void {
		let isRegenerating = false
		for (let i = 0; i < this.pbCasts.length; i++) {
			if (i !== 0) {
				isRegenerating = this.pbCasts[i] < this.regenTimes[i-1]
			}

			if (!isRegenerating) {
				this.regenTimes[i] = this.pbCasts[i] + this.pbCooldown
			} else {
				this.regenTimes[i] = this.regenTimes[i-1] + this.pbCooldown
			}
		}
	}

	private expectedBlitzes(window: HistoryEntry<EvaluatedAction[]>): number {
		const priorCasts = this.pbCasts.filter(time => time <= window.start)
		const priorRegens = this.regenTimes.filter(time =>
			time <= (window.end ?? window.start) - END_OF_WINDOW_TOLERANCE
		)

		const castsAvailable = MAX_POOLED_PB - Math.min(MAX_POOLED_PB, priorCasts.length - priorRegens.length)

		// Even though it is possible to have a triple blitz window
		// we do not recommend it as a target since it is an advanced
		// optimization that requires specific types of downtime
		return Math.min(MAX_POOLED_PB, castsAvailable)
	}
}
