import {NumberFormat, Trans} from '@lingui/react'
import Color from 'color'
import {ScaleTime, scaleUtc} from 'd3-scale'
import {Resource} from 'event'
import _ from 'lodash'
import {Analyser, AnalyserOptions} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import {SimpleItem, SimpleRow, Timeline} from 'parser/core/modules/Timeline'
import React, {ReactNode} from 'react'
import {Graph} from './Graph'
import styles from './ResourceGraphs.module.css'

export interface ResourceMeta {
	label: ReactNode
	colour: string | Color
	linear?: boolean
}

export interface ResourceDatum extends Resource {
	time: number
}

export interface ResourceData extends ResourceMeta {
	data: ResourceDatum[]
}

type ResourceInfo =
	& ResourceMeta
	& Partial<ResourceDatum>

export interface ResourceDataGroup {
	data: ResourceData[],
	row: SimpleRow
}

/**
 * Note: handle is not included in this interface to allow CounterGauges to opt out of passing it in.
 * If handle is not passed, the code there will assign the data to the default Gauges group.
 */
export interface ResourceGraphOptions {
	/** The label to display for this group of data */
	label: ReactNode,
	/** Should this group default to collapsed? If not included, the default is yes */
	collapse?: boolean,
	/** Should this group be forced to remain collapsed. If not included, the default is no */
	forceCollapsed?: boolean
	/** The height of the row for the group. If not included, defaults to 64 px */
	height?: number
}

const DEFAULT_ROW_HEIGHT: number = 64

export interface ResourceGroupOptions extends ResourceGraphOptions {
	/** The handle for this group of data */
	handle: string,
}

export const RESOURCE_HANDLE: string = 'resources'
export const GAUGE_HANDLE: string = 'gauges'

export class ResourceGraphs extends Analyser {
	static override handle = 'resourceGraphs'

	@dependency private timeline!: Timeline

	private scaleX: ScaleTime<number, number>

	private dataGroups: Map<string, ResourceDataGroup> = new Map()

	constructor(...args: AnalyserOptions) {
		super(...args)

		this.addDataGroup({
			handle: RESOURCE_HANDLE,
			label: <Trans id="core.resource-graphs.row-label">Resources</Trans>,
		})
		const {timestamp, duration} = this.parser.pull

		this.scaleX = scaleUtc()
			.domain([timestamp, timestamp + duration])
			.range([0, 1])
	}

	/**
	 * Shorthand accessor for addData with the default resources group
	 * @param resource The ResourceData to add
	 */
	public addResource(resource: ResourceData) {
		// this.addResources(resource.label, [resource])
		this.addData(RESOURCE_HANDLE, resource)
	}

	/**
	 * Shorthand accessor for addDatas with the default resources group, if adding data to display on the same sub-row
	 * @param label The sub-row label
	 * @param resources The array of ResourceData to add
	 */
	// public addResources(label: ReactNode, resources: ResourceData[]) {
	// 	this.addDatas(RESOURCE_HANDLE, resources, label)
	// }

	/**
	 * Shorthand accessor for addData with the default gauges group, creating the group if necessary
	 * @param gauge The gauge ResourceData to add
	 * @param opts The ResourceGroupOptions defining this group
	 */
	public addGauge(gauge: ResourceData, opts?: ResourceGroupOptions) {
		// this.addGauges(gauge.label, [gauge], opts)
		let gaugeGroup = this.dataGroups.get(GAUGE_HANDLE)
		if (gaugeGroup == null) {
			gaugeGroup = this.addDataGroup({
				...opts,
				handle: GAUGE_HANDLE,
				label: <Trans id="core.resource-graphs.gauge-label">Gauges</Trans>,
			})
		}

		this.addData(GAUGE_HANDLE, gauge)
	}

	/**
	 * Shorthand accessor for addDatas with the default resources group, if adding data to display on the same sub-row, creating the group if necessary
	 * @param label The sub-row label
	 * @param gauges The array of gauge ResourceData to add
	 * @param opts The ResourceGroupOptions defining this group
	 */
	// public addGauges(label: ReactNode, gauges: ResourceData[], opts?: ResourceGroupOptions) {
	// 	let gaugeGroup = this.dataGroups.get(GAUGE_HANDLE)
	// 	if (gaugeGroup == null) {
	// 		gaugeGroup = this.addDataGroup({
	// 			...opts,
	// 			handle: GAUGE_HANDLE,
	// 			label: <Trans id="core.resource-graphs.gauge-label">Gauges</Trans>,
	// 		})
	// 	}

	// 	this.addDatas(GAUGE_HANDLE, gauges, label)
	// }

	/**
	 * Adds a new data group and displays it on the timeline. Updates the group if already present and allowUpdate isn't false
	 * @param opts The ResourceGroupOptions defining this group
	 * @returns A reference to the ResourceDataGroup that was added or updated
	 */
	public addDataGroup(opts: ResourceGroupOptions): ResourceDataGroup {
		const {handle, label, collapse, forceCollapsed, height} = opts
		let resourceData = this.dataGroups.get(handle)
		if (resourceData == null) {
			const resourceRow = new SimpleRow({
				label,
				order: -200,
				height: (height ?? DEFAULT_ROW_HEIGHT),
				collapse: (collapse ?? true),
				forceCollapsed: (forceCollapsed ?? false),
				items: [
				// 	new SimpleItem({
				// 	content: <MarkerHandler handle={handle} getData={this.getDataByHandle} />,
				// 	start: 0,
				// 	end: this.parser.pull.duration,
				// 	// Forcing this item above other items in its row, such that the line
				// 	// marker is always above all graphs
				// 	depth: 1,
				// })
				],

				TooltipContent: () => <p>{label}</p>,
			})
			this.timeline.addRow(resourceRow)
			resourceData = {data: [],
				row: resourceRow,
			}
			this.dataGroups.set(handle, resourceData)
		} else {
			resourceData.row.collapse = collapse ?? resourceData.row.collapse
			resourceData.row.height = height ?? resourceData.row.height
			resourceData.row.forceCollapsed = forceCollapsed ?? resourceData.row.forceCollapsed
		}
		return resourceData
	}

	/**
	 * Adds one ResourceData object to the specified group
	 * @param handle The handle of the group to add this data to
	 * @param data The ResourceData object to add to the group
	 */
	// public addData(handle: string, data: ResourceData): void {
	// 	this.addDatas(handle, [data], data.label)
	// }

	/**
	 * Adds a list of ResourceData objects to the specified group
	 * @param handle The handle of the group to add these data to
	 * @param label The label for these data within the group
	 * @param data The array of ResourceData objects to add to the group
	 */
	public addData(handle: string, data: ResourceData): void {
		const dataGroup = this.dataGroups.get(handle)
		if (dataGroup == null) {
			return
		}

		// data.forEach(data => dataGroup?.data.push(data))
		dataGroup.data.push(data)

		// Add a row for the graph - we only need a single item per resource, as the graph is the full duration.
		// TODO: Keep an eye on performance of this. If this chews resources too much, it should be
		// relatively simple to slice the graph into multiple smaller items which can be windowed.
		dataGroup.row.addRow(new SimpleRow({
			// label,
			label: data.label,
			height: (dataGroup.row.height ?? DEFAULT_ROW_HEIGHT),
			// items: data.map(data => {
			// 	return new SimpleItem({
			// 		content: <Graph resource={data} scaleX={this.scaleX}/>,
			// 		start: 0,
			// 		end: this.parser.pull.duration,
			// 	})
			// }),
			items: [new SimpleItem({
				content: <Graph resource={data} scaleX={this.scaleX}/>,
				start: 0,
				end: this.parser.pull.duration,
			})],

			// TooltipContent: ({timestamp}: TooltipContentProps) => {
			// 	// yikes this needs o be basically rewritten
			// 	console.log(data)
			// 	const data1 = this.getDataByHandle(timestamp / this.parser.pull.duration, handle)
			// 	return (
			// 		<>
			// 			{data1.filter(x=>x.label === label).map(({label, current = 0, maximum = 0, colour}, index) => (
			// 				<div key={index}>
			// 					<Trans id="core.resource-graphs.resource-value">
			// 						{label}:
			// 						<NumberFormat value={current}/> /
			// 						<NumberFormat value={maximum}/>
			// 					</Trans>
			// 				</div>
			// 			))}
			// 		</>
			// 	)
			// },

			TooltipContent: ({timestamp}) => {
				// todo: effect this?
				const {
					label,
					current = 0,
					maximum = 0,
					colour,
				} = this.thing(data, timestamp)
				return <div>
					<span
						className={styles.resourceSwatch}
						style={{background: colour.toString()}}
					/>
					<Trans id="core.resource-graphs.resource-value">
						{label}:
						<NumberFormat value={current}/> /
						<NumberFormat value={maximum}/>
					</Trans>
				</div>
			},
		}))
	}

	private thing(datum: ResourceData, timestamp2: number) {
		// const dataGroup = this.dataGroups.get(dataHandle)
		// if (!dataGroup) { return [] }

		const {duration, timestamp: pullTimestamp} = this.parser.pull
		// const timestamp = pullTimestamp + (duration * fightPercent)
		const timestamp = pullTimestamp + timestamp2

		// const info = dataGroup.data.map(datum => {
		const lastData = {..._.findLast(datum.data, datum => datum.time <= timestamp)}
		if (datum.linear && lastData != null) {
			const lastTimestamp = lastData.time ?? pullTimestamp
			const {current: nextCurrent, time: nextTimestamp} = _.find(datum.data, datum => datum.time > timestamp) || {current: 0, time: pullTimestamp + duration}
			const delta = nextCurrent - (lastData.current ?? 0)
			const timePct = (timestamp - lastTimestamp) / (nextTimestamp - lastTimestamp)
			lastData.current = (lastData.current ?? 0) + delta * timePct
		}

		return ({
			label: datum.label,
			colour: datum.colour,
			...lastData,
		})
		// })

		// return info
	}

	/**
	 * Retrieves the resource information for display when moused over the timeline
	 * @param fightPercent The timestamp of the fight to show information at, as a percentage of the fight duration
	 * @param dataHandle The handle of the group to display information for
	 * @returns The array of ResourceInfo objects to display
	 */
	private getDataByHandle = (fightPercent: number, dataHandle: string): ResourceInfo[] => {
		const dataGroup = this.dataGroups.get(dataHandle)
		if (!dataGroup) { return [] }

		const {duration, timestamp: pullTimestamp} = this.parser.pull
		const timestamp = pullTimestamp + (duration * fightPercent)

		const info = dataGroup.data.map(datum => {
			const lastData = {..._.findLast(datum.data, datum => datum.time <= timestamp)}
			if (datum.linear && lastData != null) {
				const lastTimestamp = lastData.time ?? pullTimestamp
				const {current: nextCurrent, time: nextTimestamp} = _.find(datum.data, datum => datum.time > timestamp) || {current: 0, time: pullTimestamp + duration}
				const delta = nextCurrent - (lastData.current ?? 0)
				const timePct = (timestamp - lastTimestamp) / (nextTimestamp - lastTimestamp)
				lastData.current = (lastData.current ?? 0) + delta * timePct
			}
			return ({
				label: datum.label,
				colour: datum.colour,
				...lastData,
			})
		})

		return info
	}
}
