import {AbstractGauge, AbstractGaugeOptions} from './AbstractGauge'

interface State {
	timestamp: number
	remaining: number
}

export interface TimerGaugeOptions extends AbstractGaugeOptions {
	/** Maxiumum duration of the gauge. */
	maximum: number
}

export class TimerGauge extends AbstractGauge {
	// Just in case I ever have to change it lmao
	private readonly minimum = 0
	private maximum: number
	private lastKnownState?: State

	/** Time currently remaining on the timer. */
	get remaining() {
		// If there's no known state, we have to assume there's no time left
		if (!this.lastKnownState) {
			return this.minimum
		}

		const delta = this.parser.currentTimestamp - this.lastKnownState.timestamp
		return Math.max(this.minimum, this.lastKnownState.remaining - delta)
	}

	constructor(opts: TimerGaugeOptions) {
		super(opts)

		this.maximum = opts.maximum
	}

	/** @inheritdoc */
	reset() {
		this.set(this.minimum)
	}

	/** Refresh the gauge to its maximum value. */
	refresh() {
		this.set(this.maximum)
	}

	/** Add time to the gauge. Time over the maxium will be lost. */
	add(duration: number) {
		this.set(this.remaining + duration)
	}

	/** Set the time remaining on the timer to the given duration. Value will be bounded by provided maximum. */
	set(duration: number) {
		const remaining = Math.min(duration, this.maximum)

		this.lastKnownState = {
			timestamp: this.parser.currentTimestamp,
			remaining,
		}
	}
}
