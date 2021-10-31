import Color from 'color'
import _ from 'lodash'
import {GAUGE_HANDLE, ResourceGraphOptions} from '../ResourceGraphs/ResourceGraphs'
import {AbstractGauge, AbstractGaugeOptions} from './AbstractGauge'

interface CounterHistory {
	timestamp: number
	value: number
	minimum: number
	maximum: number
}

export interface CounterGaugeOptions extends AbstractGaugeOptions {
	/** Initial value of the gauge. Defaults to the minimum value of the gauge. */
	initialValue?: number,
	/** Minimum value of the gauge. Defaults to 0. */
	minimum?: number,
	/** Maximum value of the gauge. Defaults to 100. Value over the maximum will be considered over cap, and tracked if enabled. */
	maximum?: number,
	/** Graph options. Omit to disable graphing in the timeline for this gauge. */
	graph?: CounterGraphOptions
}

export interface CounterGraphOptions extends ResourceGraphOptions {
	/** The handle of the timeline group to display this gauge data in. If not passed, will use the default "Gauges" group */
	handle?: string
	/** The color to draw the data set in */
	color: string | Color
}

export class CounterGauge extends AbstractGauge {
	private _value: number
	private minimum: number
	private maximum: number
	overCap: number = 0

	private graphOptions?: CounterGraphOptions

	private history: CounterHistory[] = []

	get value(): number {
		return this._value
	}

	constructor(opts: CounterGaugeOptions = {}) {
		super(opts)

		this.minimum = opts.minimum || 0
		this._value = opts.initialValue || this.minimum
		this.maximum = opts.maximum || 100

		this.graphOptions = opts.graph
	}

	getValueAt(timestamp: number) {
		const counter = _.findLast(this.history, gauge => gauge.timestamp <= timestamp)
		return counter? counter.value : this.minimum
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
		const timestamp = this.parser.currentEpochTimestamp

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
	override generateResourceGraph() {
		if (this.graphOptions == null) { return }

		const graphData = {
			label: this.graphOptions.label,
			colour: this.graphOptions.color,
			data: this.history.map(entry => {
				return {time: entry.timestamp, current: entry.value, maximum: entry.maximum}
			}),
		}
		if (this.graphOptions.handle != null) {
			this.resourceGraphs.addDataGroup({...this.graphOptions, handle: this.graphOptions.handle})
			this.resourceGraphs.addData(this.graphOptions.handle, graphData)
		} else {
			this.graphOptions.handle = GAUGE_HANDLE
			this.resourceGraphs.addGauge(graphData, this.graphOptions.collapse)
		}
	}
}
