import Color from 'color'
import _ from 'lodash'
import {ReactNode} from 'react'
import {GAUGE_HANDLE, ResourceData, ResourceGraphOptions, ResourceGroupOptions} from '../ResourceGraphs/ResourceGraphs'
import {AbstractGauge, AbstractGaugeOptions} from './AbstractGauge'

const FORCE_COLLAPSE = true || process.env.NODE_ENV === 'production'

interface EnumHistory {
	timestamp: number
	values: Array<EnumEntryOption['value']>
}

export interface EnumEntryOption {
	value: string,
	color: Color,
	label: ReactNode
	tooltipHideWhenEmpty?: boolean
}

export interface EnumGaugeOptions extends AbstractGaugeOptions {
	options: EnumEntryOption[],
	maximum: number,
	/** Graph options. Omit to disable graphing in the timeline for this gauge. */
	graph?: EnumGraphOptions
}

type EnumGraphOptions =
	& Omit<ResourceGraphOptions, ''> // Not currently omitting any options, but making easier to do so in the future

export interface EnumResourceData extends ResourceData {
	type: 'shared'
	value: string,
}

export class EnumGauge extends AbstractGauge {
	private options: EnumEntryOption[]
	private maximum: number

	private graphOptions?: ResourceGraphOptions

	public history: EnumHistory[] = []

	get current(): Array<EnumEntryOption['value']> {
		return this.getValuesAt(this.parser.currentEpochTimestamp)
	}

	get capped(): boolean {
		return this.current.length === this.maximum
	}

	get empty(): boolean {
		return this.current.length === 0
	}

	constructor(opts: EnumGaugeOptions) {
		super(opts)

		this.options = opts.options
		this.maximum = opts.maximum

		this.graphOptions = opts.graph
	}

	getCountAt(value: string, timestamp: number = this.parser.currentEpochTimestamp): number {
		return this.getValuesAt(timestamp).filter(v => v === value).length
	}

	getValuesAt(timestamp: number): Array<EnumEntryOption['value']> {
		const entry = _.findLast(this.history, gauge => gauge.timestamp <= timestamp)
		return entry != null ? entry.values : []
	}

	/** @inheritdoc */
	reset() {
		// NOTE: This assumes counters always reset to their minimum value.
		// Should that not be the case, probbaly needs a `resetTo` value.
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

	/** Adds the specified number of entries of the given value to the gauge. Defaults to adding one entry.  */
	generate = (value: string, count: number = 1) => {
		if (!this.options.some(option => option.value === value)) { return }
		const generatedValues = [...this.current]
		generatedValues.push(...Array<EnumEntryOption['value']>(count).fill(value))
		this.set(generatedValues)
	}

	/** Removes the specified number of entries of the given value from the gauge. Defaults to removing one entry. */
	spend = (value: string, count: number = 1) => {
		if (!this.options.some(option => option.value === value)) { return }
		const spentValues = [...this.current]
		while (count > 0) {
			const valueIndex = _.lastIndexOf(spentValues, value)
			if (valueIndex <= 0) { break }
			spentValues.splice(valueIndex, 1)
			count--
		}
		this.set(spentValues)
	}

	/** Set the current value of the gauge. Value will automatically be bounded to valid values */
	set(values: Array<EnumEntryOption['value']>) {
		const correctedValues = values.filter(value => this.options.some(option => option.value === value)).slice(0, this.maximum)

		this.pushHistory(correctedValues)
	}

	private pushHistory(values: Array<EnumEntryOption['value']>) {
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

		const {handle, tooltipHideMaximum} = this.graphOptions
		// Set up a ResourceData object for each of the enum options
		const graphDatas = this.options.map<EnumResourceData>(option => {
			return {
				label: option.label,
				colour: option.color,
				data: [],
				tooltipHideWhenEmpty: option.tooltipHideWhenEmpty,
				tooltipHideMaximum,
				value: option.value,
				type: 'shared',
			}
		})
		// Convert the list of history entries into a stacked set of counter-gauge style history entries
		this.history.forEach(entry => {
			graphDatas.forEach(graphData => {
				graphData.data.push({time: entry.timestamp, maximum: this.maximum, current: 0})
			})
			// Loop through the enum entries in this timestamp and set the graph data accordingly
			entry.values.forEach(entryValue => {
				if (!this.options.some(option => option.value === entryValue)) { return }
				graphDatas.forEach(graphData => {
					const graphDatum = graphData.data[graphData.data.length - 1]
					if (graphData.value === entryValue) {
						// If we haven't set the base value for stacking the display yet, set it to the sum of the current values we've already plugged in for the other enum options
						// This makes sure the graph tries to respect the order in which the enums were added
						if (graphDatum.base == null) {
							graphDatum.base = graphDatas.reduce((sum, gd) => { return sum + gd.data[gd.data.length-1].current }, 0)
						}
						// Set the current value to the number of enum entry values matching the current option
						graphDatum.current = entry.values.filter(entry => entry === entryValue).length
					}
				})
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
