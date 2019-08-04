import {AbstractGauge} from './AbstractGauge'

export class CounterGauge extends AbstractGauge {
	private value: number
	private minimum: number
	private maximum: number

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
		this.value = this.minimum
	}
}
