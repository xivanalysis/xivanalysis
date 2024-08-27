import _ from 'lodash'
import {GAUGE_HANDLE, ResourceGraphOptions, ResourceGroupOptions} from '../ResourceGraphs/ResourceGraphs'
import {AbstractGauge, AbstractGaugeOptions} from './AbstractGauge'
import {SetEntryOption, SetGraphOptions, SetResourceData} from './SetGauge'

const FORCE_COLLAPSE = true || process.env.NODE_ENV === 'production'

interface SetEnumHistory {
	timestamp: number
	groups: SetEnumHistoryEntry[],
}

interface SetEnumHistoryEntry {
	handle: string,
	value: SetEntryOption['value']
}

export interface SetEnumGroup {
	handle: string,
	options: SetEntryOption[],
}

export interface SetEnumGaugeOptions extends AbstractGaugeOptions {
	groups: SetEnumGroup[],
	/** Graph options. Omit to disable graphing in the timeline for this gauge. */
	graph?: SetGraphOptions
}

export interface SetEnumResourceData extends SetResourceData {
	handle: string,
}

export class SetEnumGauge extends AbstractGauge {
	private groups: SetEnumGroup[]

	private graphOptions?: ResourceGraphOptions

	public history: SetEnumHistory[] = []
	public overcap = 0

	get current(): SetEnumHistoryEntry[] {
		return this.getValuesAt(this.parser.currentEpochTimestamp)
	}

	get capped(): boolean {
		return this.current.every(group => group.value != null)
	}

	get empty(): boolean {
		return this.current.every(group => group.value == null)
	}

	private copyCurrent(): SetEnumHistoryEntry[] {
		const copy: SetEnumHistoryEntry[] = []
		this.current.forEach(group => copy.push({handle: group.handle, value: group.value}))
		return copy
	}

	constructor(opts: SetEnumGaugeOptions) {
		super(opts)

		this.groups = opts.groups

		this.graphOptions = opts.graph
	}

	getStateAt(handle: string, value: string, timestamp: number = this.parser.currentEpochTimestamp): boolean {
		return this.getValuesAt(timestamp).find(group => group.handle === handle)?.value === value
	}

	getValuesAt(timestamp: number): SetEnumHistoryEntry[] {
		const entry = _.findLast(this.history, gauge => gauge.timestamp <= timestamp)
		return entry?.groups ?? []
	}

	/** @inheritdoc */
	reset() {
		this.set([])
	}

	clear(handle: string) {
		this.set(this.copyCurrent().filter(group => group.handle !==  handle))
	}

	raise() {
		this.reset()
	}

	init() {
		// Ensure we have a gauge init event, can't do in constructor because the parser reference might not be there yet
		if (this.history.length === 0) {
			this.history.push({
				timestamp: this.parser.pull.timestamp,
				groups: [],
			})
		}
	}

	/** Adds the specified value to the gauge  */
	generate = (handle: string, value: string) => {
		const group = this.groups.find(group => group.handle === handle)
		if (group == null) { return }
		if (!group.options.some(option => option.value === value)) { return }

		// Overwriting with same value, note and exist
		if (this.getStateAt(handle, value)) {
			this.overcap++
			return
		}

		// Overwriting with a different value, note and continue
		if (group.options.length > 0) {
			this.overcap++
		}

		const generatedValues = this.copyCurrent()
		const generatedGroup = generatedValues.find(genGroup => genGroup.handle === handle)

		if (generatedGroup == null) {
			generatedValues.push({handle, value})
		} else {
			generatedGroup.value = value
		}

		this.set(generatedValues)
	}

	/** Removes the specified value from the gauge */
	spend = (handle: string, value: string) => {
		const group = this.groups.find(group => group.handle === handle)
		if (group == null) { return }
		if (!group.options.some(option => option.value === value)) { return }
		if (!this.getStateAt(handle, value)) { return } // TODO: Implement prior state correction here

		const spentValues = this.copyCurrent().filter(spentGroup => spentGroup.handle !== handle)

		this.set(spentValues)
	}

	/** Set the current value of the gauge. Value will automatically be bounded to valid values */
	set(values: SetEnumHistoryEntry[]) {
		// Filter out input where the handle is invalid, or the value is missing from that groups options, and remove duplicate handles
		const correctedValues = values.filter((value, index) => this.groups.some(group => group.handle === value.handle &&
			group.options.some(option => option.value === value.value) &&
			values.findIndex(val => val.handle === value.handle) === index
		))

		this.pushHistory(correctedValues)
	}

	private pushHistory(groups: SetEnumHistoryEntry[]) {
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
			groups,
		})
	}

	/** @inheritdoc */
	override generateResourceGraph() {
		if (this.graphOptions == null) { return }

		const {handle, tooltipHideWhenEmpty} = this.graphOptions
		// Set up a ResourceData object for each of the enum options
		const graphDatas: SetEnumResourceData[] = []
		this.groups.forEach(group => {
			graphDatas.push(...group.options.map<SetEnumResourceData>(option => {
				return {
					label: option.label,
					colour: option.color,
					data: [],
					tooltipHideWhenEmpty,
					tooltipHideMaximum: true, // A side effect of the way this works is the tooltip would imply a 'maximum' of however many options are in the set. Don't do that.
					base: this.groups.indexOf(group), // data within the same group shares a common base, so they exist within the same timeline row
					value: option.value,
					handle: group.handle,
					type: 'discrete',
				}
			}))
		})
		// Convert the list of history entries into a stacked set of counter-gauge style history entries
		this.history.forEach(entry => {
			graphDatas.forEach(graphData => {
				graphData.data.push({
					time: entry.timestamp,
					maximum: this.groups.length,
					current: entry.groups.find(group => group.handle === graphData.handle)?.value === graphData.value ? 1 : 0,
					base: graphData.base,
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
