import {AbstractGauge, AbstractGaugeOptions} from './AbstractGauge'

interface CounterHistory {
	timestamp: number
	value: number
	minimum: number
	maximum: number
}

export interface CounterGaugeOptions {
	/** Initial value of the gauge. Defaults to the minimum value of the gauge. */
	initialValue?: number,
	/** Minimum value of the gauge. Defaults to 0. */
	minimum?: number,
	/** Maximum value of the gauge. Defaults to 100. Value over the maximum will be considered over cap, and tracked if enabled. */
	maximum?: number,
	/** Whether or not to track values over cap for use in suggestions and similar. Disable if over-capping is expected. */
	trackOverCap?: boolean,
}

export class CounterGauge extends AbstractGauge {
	private value: number
	private minimum: number
	private maximum: number

	private trackOverCap: boolean
	private overCap: number = 0

	private history: CounterHistory[] = []

	constructor(opts: CounterGaugeOptions & AbstractGaugeOptions = {}) {
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
		this.set(this.minimum)
	}

	/** Modify the current value by the provided amount. Equivalent to `set(currentValue + amount)` */
	modify(amount: number) {
		this.set(this.value + amount)
	}

	/** Set the current value of the gauge. Value will automatically be bounded to valid values. Value over the maximum will be tracked as overcap. */
	set(value: number) {
		this.value = Math.min(Math.max(value, this.minimum), this.maximum)

		// TODO: underflow means tracking was out of sync - look into backtracking to adjust history?
		const diff = value - this.value

		if (this.trackOverCap && diff > 0) {
			this.overCap += diff
		}

		this.pushHistory()
	}

	/** Set a new minimum value for the gauge. Equivalent to `setBounds(newMin, currentMax)`. */
	setMinimum(minimum: number) {
		this.setBounds(minimum, this.maximum)
	}

	/** Set a new maximum value for the gauge. Equivalent to `setBounds(currentMin, newMax)`. */
	setMaximum(maximum: number) {
		this.setBounds(this.minimum, maximum)
	}

	/** Set new bounds for the gauge. If required, the current value will be updated to remain within bounds. */
	setBounds(minimum: number, maximum: number) {
		this.minimum = minimum
		this.maximum = maximum

		// Ensure the value remains within bounds by re-setting it
		this.set(this.value)
	}

	private pushHistory() {
		const {timestamp} = this

		// Ensure we're not generating multiple entries at the samt timestamp
		const prevTimestamp = this.history.length
			? this.history[this.history.length - 1].timestamp
			: NaN
		if (timestamp === prevTimestamp) {
			this.history.pop()
		}

		this.history.push({
			timestamp,
			value: this.value,
			minimum: this.minimum,
			maximum: this.maximum,
		})
	}
}
