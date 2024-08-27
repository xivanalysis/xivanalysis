import Color from 'color'
import _ from 'lodash'
import {ReactNode} from 'react'
import {GAUGE_HANDLE, ResourceData, ResourceGraphOptions, ResourceGroupOptions} from '../ResourceGraphs/ResourceGraphs'
import {AbstractGauge, AbstractGaugeOptions} from './AbstractGauge'

const FORCE_COLLAPSE = true || process.env.NODE_ENV === 'production'

interface SetHistory {
	timestamp: number
	values: Array<SetEntryOption['value']>
}

export interface SetEntryOption {
	value: string,
	color: Color,
	label: ReactNode
}

export interface SetGaugeOptions extends AbstractGaugeOptions {
	options: SetEntryOption[],
	/** Graph options. Omit to disable graphing in the timeline for this gauge. */
	graph?: SetGraphOptions
}

export type SetGraphOptions = Omit<ResourceGraphOptions, 'tooltipHideMaximum'>

export interface SetResourceData extends ResourceData {
	type: 'discrete'
	base: number,
	value: string,
}

export class SetGauge extends AbstractGauge {
	private options: SetEntryOption[]

	private graphOptions?: ResourceGraphOptions

	public history: SetHistory[] = []
	public overcap = 0

	get current(): Array<SetEntryOption['value']> {
		return this.getValuesAt(this.parser.currentEpochTimestamp)
	}

	get capped(): boolean {
		return this.current.length === this.options.length
	}

	get empty(): boolean {
		return this.current.length === 0
	}

	constructor(opts: SetGaugeOptions) {
		super(opts)

		this.options = opts.options

		this.graphOptions = opts.graph
	}

	getStateAt(value: string, timestamp: number = this.parser.currentEpochTimestamp): boolean {
		return this.getValuesAt(timestamp).some(v => v === value)
	}

	getValuesAt(timestamp: number): Array<SetEntryOption['value']> {
		const entry = _.findLast(this.history, gauge => gauge.timestamp <= timestamp)
		return entry != null ? entry.values : []
	}

	/** @inheritdoc */
	reset() {
		this.set([])
	}

	clear(value: string) {
		this.set(this.current.filter(v => v !== value))
	}

	raise() {
		this.reset()
	}

	init() {
		// Ensure we have a gauge init event, can't do in constructor because the parser reference might not be there yet
		if (this.history.length === 0) {
			this.history.push({
				timestamp: this.parser.pull.timestamp,
				values: [],
			})
		}
	}

	/** Adds the specified value to the gauge  */
	generate = (value: string) => {
		if (!this.options.some(option => option.value === value)) { return }
		if (this.getStateAt(value)) {
			this.overcap++
			return
		}
		const generatedValues = [...this.current]
		generatedValues.push(value)
		this.set(generatedValues)
	}

	/** Removes the specified value from the gauge */
	spend = (value: string) => {
		if (!this.options.some(option => option.value === value)) { return }
		if (!this.getStateAt(value)) { return } // TODO: Implement prior state correction here
		const spentValues = [...this.current]
		const valueIndex = _.lastIndexOf(spentValues, value)
		if (valueIndex < 0) { return }
		spentValues.splice(valueIndex, 1)
		this.set(spentValues)
	}

	/** Set the current value of the gauge. Value will automatically be bounded to valid values */
	set(values: Array<SetEntryOption['value']>) {
		const correctedValues = values.filter(value => this.options.some(option => option.value === value)).slice(0, this.options.length)

		this.pushHistory(correctedValues)
	}

	private pushHistory(values: Array<SetEntryOption['value']>) {
		const timestamp = this.parser.currentEpochTimestamp

		// Ensure we're not generating multiple entries at the same timestamp
		const prevTimestamp = this.history.length
			? this.history[this.history.length - 1].timestamp
			: NaN
		if (timestamp === prevTimestamp) {
			this.history.pop()
		}

		this.history.push({
			timestamp,
			values,
		})
	}

	/** @inheritdoc */
	override generateResourceGraph() {
		if (this.graphOptions == null) { return }

		const {handle, tooltipHideWhenEmpty} = this.graphOptions
		// Set up a ResourceData object for each of the enum options
		const graphDatas = this.options.map<SetResourceData>(option => {
			return {
				label: option.label,
				colour: option.color,
				data: [],
				tooltipHideWhenEmpty,
				tooltipHideMaximum: true, // A side effect of the way this works is the tooltip would imply a 'maximum' of however many options are in the set. Don't do that.
				base: this.options.indexOf(option),
				value: option.value,
				type: 'discrete',
			}
		})
		// Convert the list of history entries into a stacked set of counter-gauge style history entries
		this.history.forEach(entry => {
			graphDatas.forEach(graphData => {
				graphData.data.push({time: entry.timestamp, maximum: this.options.length, current: entry.values.filter(v => v === graphData.value).length, base: graphData.base})
			})
		})

		// Send all the data over to ResourceGraphs
		if (handle != null) {
			this.resourceGraphs.addDataGroup({...this.graphOptions, handle, collapse: FORCE_COLLAPSE, forceCollapsed: FORCE_COLLAPSE})
			graphDatas.forEach(graphData => {
				this.resourceGraphs.addData(handle, graphData)
			})
		} else {
			const groupOptions: ResourceGroupOptions = {...this.graphOptions, handle: GAUGE_HANDLE, collapse: FORCE_COLLAPSE, forceCollapsed: FORCE_COLLAPSE}
			graphDatas.forEach(graphData => {
				this.resourceGraphs.addGauge(graphData, groupOptions)
			})
		}
	}
}
