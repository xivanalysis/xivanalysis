import {EvaluatedAction} from '../EvaluatedAction'
import {HistoryEntry} from '../History'
import {
	ExpectedGcdCountEvaluator,
	ExpectedGcdCountOptions,
} from './ExpectedGcdCountEvaluator'

interface RequiredGcdCountOptions extends Omit<ExpectedGcdCountOptions, 'expectedGcds'> {
	requiredGcds: number
	isRushed?: (window: HistoryEntry<EvaluatedAction[]>) => boolean
}
/**
 * Checks if a window contains the required number of GCDs.
 * All GCDs used in the window will be counted towards the total.
 */
export class RequiredGcdCountEvaluator extends ExpectedGcdCountEvaluator {

	private requiredGcds: number
	private isRushed: (window: HistoryEntry<EvaluatedAction[]>) => boolean

	constructor(opts: RequiredGcdCountOptions) {
		super({expectedGcds: opts.requiredGcds, ...opts})
		this.requiredGcds = opts.requiredGcds
		this.isRushed = opts.isRushed ?? (() => false)
	}

	protected override calculateExpectedGcdsForWindow(window: HistoryEntry<EvaluatedAction[]>) {
		if (this.isRushed(window)) {
			return super.calculateExpectedGcdsForWindow(window)
		}

		return this.requiredGcds + this.adjustCount(window)
	}
}
