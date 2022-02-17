import {ChartDataSets} from 'chart.js'
import Color from 'color'
import _ from 'lodash'
import {GAUGE_HANDLE} from '../ResourceGraphs/ResourceGraphs'
import {AbstractGauge, AbstractGaugeOptions, GaugeGraphOptions} from './AbstractGauge'

type GaugeEventReason =
	| 'init'
	| 'generate'
	| 'spend'
	| 'reset'
	| 'changeBounds'

interface CounterHistory {
	timestamp: number
	value: number
	minimum: number
	maximum: number
	delta: number
	reason: GaugeEventReason
}

export interface CounterGaugeOptions extends AbstractGaugeOptions {
	/** Initial value of the gauge. Defaults to the minimum value of the gauge. */
	initialValue?: number,
	/** Minimum value of the gauge. Defaults to 0. */
	minimum?: number,
	/** Maximum value of the gauge. Defaults to 100. Value over the maximum will be considered over cap, and tracked if enabled. */
	maximum?: number,
	/** Chart options. Omit to disable charting for this gauge. Superseded by graph if both are provided */
	chart?: CounterChartOptions,
	/** Graph options. Omit to disable graphing in the timeline for this gauge. */
	graph?: GaugeGraphOptions
	/**
	 * Should this gauge correct its history in the event of underflow? Must pass true to enable
	 * Important note:
	 *   This WILL mutate the history array, but will not re-run any additional logic done partway through the analysis.
	 *   If you are driving suggestions or other logic off gauge values at specific points in time, that should be run during
	 *   an onComplete hook, or within the calling class's output function
	 */
	correctHistory?: boolean
	/**
	 * Are gauge generation events deterministic (always the same amount when they occur)? Defaults to true if not specified
	 * Used by the history correction algorithm to decide how far back to look when underflow is detected
	 * Examples of deterministic gauges: NIN's Ninki, RDM's mana
	 * Examples of non-deterministic gauges: DNC's Feathers and Esprit, SAM's Kenki
	 */
	deterministic?: boolean
}

export interface CounterChartOptions {
	/** Label to display on the data set. */
	label: string
	/** Color to draw the data set in. Defaults to grey. */
	color?: string | Color
}

export class CounterGauge extends AbstractGauge {
	private initialValue: number
	private _value: number
	private minimum: number
	private maximum: number
	overCap: number = 0
	private correctHistory: boolean
	private deterministic: boolean

	private chartOptions?: CounterChartOptions
	private graphOptions?: GaugeGraphOptions

	public history: CounterHistory[] = []

	get value(): number {
		return this._value
	}

	get capped(): boolean {
		return this._value >= this.maximum
	}

	get empty(): boolean {
		return this._value <= this.minimum
	}

	get totalSpent(): number {
		return this.history.filter(entry => entry.reason === 'spend').reduce((total, entry) => total + Math.abs(entry.delta), 0)
	}

	get totalGenerated(): number {
		return this.history.filter(entry => entry.reason === 'generate').reduce((total, entry) => total + Math.abs(entry.delta), 0)
	}

	constructor(opts: CounterGaugeOptions = {}) {
		super(opts)

		this.minimum = opts.minimum ?? 0
		this.initialValue = opts.initialValue ?? this.minimum
		this._value = this.initialValue
		this.maximum = opts.maximum ?? 100
		this.correctHistory = opts.correctHistory ?? false
		this.deterministic = opts.deterministic ?? true

		this.chartOptions = opts.chart
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
		this.set(this.minimum, 'reset')
	}

	raise() {
		this.set(this.minimum, 'init')
	}

	init() {
		// Ensure we have a gauge init event, can't do in constructor because the parser reference might not be there yet
		if (this.history.length === 0) {
			this.history.push({
				timestamp: this.parser.pull.timestamp,
				value: this.initialValue,
				minimum: this.minimum,
				maximum: this.maximum,
				delta: 0,
				reason: 'init',
			})
		}
	}

	/** Modify the current value by the provided amount. Equivalent to `set(currentValue + amount)` */
	modify(amount: number) {
		this.set(this._value + amount)
	}

	/** Increase the current value by the provided amount. */
	generate = (amount: number) => this.modify(amount)

	/** Decrease the current value by the provided amount. */
	spend = (amount: number) => this.modify(-amount)

	/** Set the current value of the gauge. Value will automatically be bounded to valid values. Value over the maximum will be tracked as overcap. */
	set(value: number, reason?: GaugeEventReason) {
		const delta = value - this.value

		const _reason = reason ?? delta > 0 ? 'generate' : 'spend'

		const newValue = Math.min(Math.max(value, this.minimum), this.maximum)

		const diff = value - newValue
		if (diff > 0) {
			this.overCap += diff
		} else if (diff < 0 && this.correctHistory) {
			this.correctGaugeHistory(delta, this._value)
		}

		this._value = newValue
		this.pushHistory(_reason, delta)
	}

	private correctGaugeHistory(spenderCost: number, currentGauge: number) {
		spenderCost = Math.abs(spenderCost)

		// Get the most recent initialisation event (or generation event if this gauge isn't deterministic) we've recorded
		const lastGeneratorIndex = _.findLastIndex(this.history, event => (!this.deterministic && event.reason === 'generate') || event.reason === 'init')

		// Add the amount we underran the simulation by to the last generation event, and all events through the current one
		const underrunAmount = Math.abs(currentGauge - spenderCost)
		for (let i = lastGeneratorIndex; i < this.history.length; i++) {
			this.history[i].value += underrunAmount
		}

		// If the last generator was also the first event (dungeons with stocked resources, etc.), we're done
		if (lastGeneratorIndex === 0) {
			return
		}

		// Find the last non-generation event previous to the last generator we already found, and smooth the graph between the two events by adding a proportional amount of the underrun value to each event
		const previousSpenderIndex = _.findLastIndex(this.history.slice(0, lastGeneratorIndex), event => event.reason !== 'generate')
		const adjustmentPerEvent = underrunAmount / (lastGeneratorIndex - previousSpenderIndex)
		for (let i = previousSpenderIndex + 1; i < lastGeneratorIndex; i ++) {
			this.history[i].value += adjustmentPerEvent * (i - previousSpenderIndex)
		}
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
		this.set(this._value, 'changeBounds')
	}

	private pushHistory(reason: GaugeEventReason, delta: number) {
		const timestamp = this.parser.currentEpochTimestamp

		// Ensure we're not generating multiple entries at the same timestamp
		const prevTimestamp = this.history.length
			? this.history[this.history.length - 1].timestamp
			: NaN
		if (timestamp === prevTimestamp) {
			const prevEvent = this.history.pop()
			// If we already spent or intitialised gauge at this timestamp, retain the reason to keep from backtracking past it
			if (prevEvent?.reason === 'spend' || prevEvent?.reason === 'init') {
				reason = prevEvent.reason
			}
		}

		this.history.push({
			timestamp,
			value: this._value,
			minimum: this.minimum,
			maximum: this.maximum,
			delta,
			reason,
		})
	}

	/** @inheritdoc */
	override generateResourceGraph() {
		if (this.graphOptions == null) { return }

		const {handle, color, label} = this.graphOptions
		const graphData = {
			label,
			colour: color,
			data: this.history.map(entry => {
				return {time: entry.timestamp, current: entry.value, maximum: entry.maximum}
			}),
		}
		if (handle != null) {
			this.resourceGraphs.addDataGroup({...this.graphOptions, handle})
			this.resourceGraphs.addData(handle, graphData)
		} else {
			this.resourceGraphs.addGauge(graphData, {...this.graphOptions, handle: GAUGE_HANDLE})
		}
	}

	/** @inheritdoc */
	override generateDataset() {
		// If there's no chart options, or if there are graph options, provide nothing (prefer graph)
		if (this.chartOptions == null || this.graphOptions != null) {
			return
		}

		// Map the data into something the chart will understand
		const data = this.history.map(entry => ({
			t: entry.timestamp - this.parser.pull.timestamp,
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
			/* eslint-disable @typescript-eslint/no-magic-numbers */
			const chartColor = Color(color)
			dataSet.backgroundColor = chartColor.fade(0.8).toString()
			dataSet.borderColor = chartColor.fade(0.5).toString()
			/* eslint-enable @typescript-eslint/no-magic-numbers */
		}

		return dataSet
	}
}
