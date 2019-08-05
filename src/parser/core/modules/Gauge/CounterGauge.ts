import {AbstractGauge} from './AbstractGauge'

interface CounterHistory {
	timestamp: number
	value: number
	minimum: number
	maximum: number
}

// TODO: need to work out how to get the timestamp in here sanely for history
export class CounterGauge extends AbstractGauge {
	private value: number
	private minimum: number
	private maximum: number
	private overCap: number = 0
	private history: CounterHistory[] = []

	constructor(opts: {
		value?: number,
		minimum?: number,
		maximum?: number,
	}) {
		super()

		this.minimum = opts.minimum || 0
		this.value = opts.value || this.minimum
		this.maximum = opts.maximum || 100
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

		// TODO: should I have something like `trackOvercap: boolean`? stuff like MNK GL and such will constantly overcap, and it's a bit of a non-issue.
		if (diff > 0) {
			this.overCap += diff
		}

		// TODO: This might be better off in a seperate fn?
		// TODO: If the above, probably should make it check if it needs to merge with previous timestamp if equal?
		this.history.push({
			timestamp: 0, // TODO
			value: this.value,
			minimum: this.minimum,
			maximum: this.maximum,
		})
	}
}
