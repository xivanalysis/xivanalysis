import {ChartDataSets} from 'chart.js'
import Color from 'color'
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
	/** Chart options. Omit to disable charting for this gauge. */
	chart?: CounterChartOptions,
}

export interface CounterChartOptions {
	/** Label to display on the data set */
	label: string
	/** Color to draw the data set in. Defaults to grey. */
	color?: string | Color
}

export class CounterGauge extends AbstractGauge {
	private _value: number
	private minimum: number
	private maximum: number
	overCap: number = 0

	private chartOptions?: CounterChartOptions

	private history: CounterHistory[] = []

	get value(): number {
		return this._value
	}

	constructor(opts: CounterGaugeOptions & AbstractGaugeOptions = {}) {
		super(opts)

		this.minimum = opts.minimum || 0
		this._value = opts.initialValue || this.minimum
		this.maximum = opts.maximum || 100

		this.chartOptions = opts.chart
	}

	/** @inheritdoc */
	reset() {
		// NOTE: This assumes counters always reset to their minimum value.
		// Should that not be the case, probbaly needs a `resetTo` value.
		this.set(this.minimum)
	}

	/** Modify the current value by the provided amount. Equivalent to `set(currentValue + amount)` */
	modify(amount: number) {
		this.set(this._value + amount)
	}

	/** Set the current value of the gauge. Value will automatically be bounded to valid values. Value over the maximum will be tracked as overcap. */
	set(value: number) {
		this._value = Math.min(Math.max(value, this.minimum), this.maximum)

		// TODO: underflow means tracking was out of sync - look into backtracking to adjust history?
		const diff = value - this._value
		if (diff > 0) {
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
		this.set(this._value)
	}

	private pushHistory() {
		const timestamp = this.parser.currentTimestamp

		// Ensure we're not generating multiple entries at the samt timestamp
		const prevTimestamp = this.history.length
			? this.history[this.history.length - 1].timestamp
			: NaN
		if (timestamp === prevTimestamp) {
			this.history.pop()
		}

		this.history.push({
			timestamp,
			value: this._value,
			minimum: this.minimum,
			maximum: this.maximum,
		})
	}

	/** @inheritdoc */
	generateDataset() {
		// If there's no chart options, provide nothing
		if (!this.chartOptions) {
			return
		}

		// Map the data into something the chart will understand
		const data = this.history.map(entry => ({
			t: entry.timestamp - this.parser.fight.start_time,
			y: entry.value,
		}))

		// Build the final data set
		const {label, color} = this.chartOptions
		const dataSet: ChartDataSets = {
			label,
			data,
			steppedLine: true,
		}

		if (color) {
			/* tslint:disable:no-magic-numbers */
			const chartColor = Color(color)
			dataSet.backgroundColor = chartColor.fade(0.8).toString()
			dataSet.borderColor = chartColor.fade(0.5).toString()
			/* tslint:enable:no-magic-numbers */
		}

		return dataSet
	}
}
