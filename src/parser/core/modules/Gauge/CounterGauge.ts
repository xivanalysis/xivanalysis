import {AbstractGauge, AbstractGaugeOptions} from './AbstractGauge'

interface CounterHistory {
	timestamp: number
	value: number
	minimum: number
	maximum: number
}

export class CounterGauge extends AbstractGauge {
	private value: number
	private minimum: number
	private maximum: number

	private trackOverCap: boolean
	private overCap: number = 0

	private history: CounterHistory[] = []

	constructor(opts: {
		/** Initial value of the gauge. Defaults to the minimum value of the gauge. */
		initialValue?: number,
		/** Minimum value of the gauge. Defaults to 0. */
		minimum?: number,
		/** Maximum value of the gauge. Defaults to 100. Value over the maximum will be considered over cap, and tracked if enabled. */
		maximum?: number,
		/** Whether or not to track values over cap for use in suggestions and similar. Disable if over-capping is expected. */
		trackOverCap?: boolean,
	} & AbstractGaugeOptions = {}) {
		super(opts)

		this.minimum = opts.minimum || 0
		this.value = opts.initialValue || this.minimum
		this.maximum = opts.maximum || 100

		this.trackOverCap = opts.trackOverCap != null? opts.trackOverCap : true
	}

	/** @inheritdoc */
	reset() {
		// NOTE: This assumes counters always reset to their minimum value.
		// Should that not be the case, probbaly needs a `resetTo` value.
		this.setValue(this.minimum)
	}

	/** Set the current value of the gauge. Value will automatically be bounded to valid values. Value over the maximum will be tracked as overcap. */
	setValue(value: number) {
		this.value = Math.min(Math.max(value, this.minimum), this.maximum)

		// TODO: underflow means tracking was out of sync - look into backtracking to adjust history?
		const diff = value - this.value

		// Only track if we need to - some stack-based gauges just need to stay up, overcapping is expected on a regular basis.
		if (this.trackOverCap && diff > 0) {
			this.overCap += diff
		}

		// TODO: This might be better off in a seperate fn?
		// TODO: If the above, probably should make it check if it needs to merge with previous timestamp if equal?
		this.history.push({
			timestamp: this.timestamp,
			value: this.value,
			minimum: this.minimum,
			maximum: this.maximum,
		})
	}
}
