import {Trans} from '@lingui/react'
import Color from 'color'
import {ScaleTime, scaleUtc} from 'd3-scale'
import {Resource} from 'event'
import _ from 'lodash'
import {Analyser, AnalyserOptions} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import {SimpleItem, SimpleRow, Timeline} from 'parser/core/modules/Timeline'
import React, {ReactNode} from 'react'
import {Graph} from './Graph'
import {MarkerHandler, ResourceInfo} from './MarkerHandler'

export interface ResourceMeta {
	label: ReactNode
	colour: string | Color
}

export interface ResourceDatum extends Resource {
	time: number
}

export interface ResourceData extends ResourceMeta {
	data: ResourceDatum[]
}

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
}
export interface ResourceGroupOptions extends ResourceGraphOptions {
	/** The handle for this group of data */
	handle: string,
}

/** Exporting these as constants in case other code has a use for them (See CounterGauge's use of GAUGE_HANDLE) */
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
		this.addResources(resource.label, [resource])
	}

	/**
	 * Shorthand accessor for addDatas with the default resources group, if adding data to display on the same sub-row
	 * @param label The sub-row label
	 * @param resources The array of ResourceData to add
	 */
	public addResources(label: ReactNode, resources: ResourceData[]) {
		this.addDatas(RESOURCE_HANDLE, resources, label)
	}

	/**
	 * Shorthand accessor for addData with the default gauges group, creating the group if necessary
	 * @param gauge The gauge ResourceData to add
	 * @param collapse Set the default collapse state of the gauge group, if the group must be created. Defaults to collapsed
	 */
	public addGauge(gauge: ResourceData, collapse: boolean = true) {
		this.addGauges(gauge.label, [gauge], collapse)
	}

	/**
	 * Shorthand accessor for addDatas with the default resources group, if adding data to display on the same sub-row, creating the group if necessary
	 * @param label The sub-row label
	 * @param gauges The array of gauge ResourceData to add
	 * @param collapse Set the default collapse state of the gauge group, if the group must be created. Defaults to collapsed
	 */
	public addGauges(label: ReactNode, gauges: ResourceData[], collapse: boolean = true) {
		let gaugeGroup = this.dataGroups.get(GAUGE_HANDLE)
		if (gaugeGroup == null) {
			gaugeGroup = this.addDataGroup({
				handle: GAUGE_HANDLE,
				label: <Trans id="core.resource-graphs.gauge-label">Gauges</Trans>,
				collapse,
			})
		}

		this.addDatas(GAUGE_HANDLE, gauges, label)
	}

	/**
	 * Adds a new data group and displays it on the timeline. Updates the label and collapse state if the group already exists in the collection
	 * @param handle The handle for this data group
	 * @param label The label to display for this group
	 * @param collapse Set the default collapse state of the group. Defaults to collapsed
	 * @param forceCollapsed If the group defaults to collapsed, sets whether it will be forced to stay collapsed. Defaults to false (allows expansion)
	 * @returns A reference to the ResourceDataGroup that was added or updated
	 */
	public addDataGroup(opts: ResourceGroupOptions): ResourceDataGroup {
		const {handle, label, collapse, forceCollapsed} = opts
		let resourceData = this.dataGroups.get(handle)
		if (resourceData == null) {
			const resourceRow = new SimpleRow({
				label,
				order: -200,
				height: 64,
				collapse: (collapse ?? true),
				forceCollapsed: (forceCollapsed ?? false),
				items: [new SimpleItem({
					content: <MarkerHandler handle={handle} getData={this.getDataByHandle} />,
					start: 0,
					end: this.parser.pull.duration,
					// Forcing this item above other items in its row, such that the line
					// marker is always above all graphs
					depth: 1,
				})],
			})
			this.timeline.addRow(resourceRow)
			resourceData = {data: [],
				row: resourceRow,
			}
			this.dataGroups.set(handle, resourceData)
		} else {
			resourceData.row.label = label
			resourceData.row.collapse = collapse
		}
		return resourceData
	}

	/**
	 * Adds one ResourceData object to the specified group
	 * @param handle The handle of the group to add this data to
	 * @param data The ResourceData object to add to the group
	 */
	public addData(handle: string, data: ResourceData): void {
		this.addDatas(handle, [data], data.label)
	}
	/**
	 * Adds a list of ResourceData objects to the specified group
	 * @param handle The handle of the group to add these data to
	 * @param label The label for these data within the group
	 * @param data The array of ResourceData objects to add to the group
	 */
	public addDatas(handle: string, data: ResourceData[], label: ReactNode): void {
		const dataGroup = this.dataGroups.get(handle)
		if (dataGroup == null) {
			return
		}

		data.forEach(data => dataGroup?.data.push(data))

		// Add a row for the graph - we only need a single item per resource, as the graph is the full duration.
		// TODO: Keep an eye on performance of this. If this chews resources too much, it should be
		// relatively simple to slice the graph into multiple smaller items which can be windowed.
		dataGroup.row.addRow(new SimpleRow({
			label,
			height: 64,
			items: data.map(data => {
				return new SimpleItem({
					content: <Graph resource={data} scaleX={this.scaleX}/>,
					start: 0,
					end: this.parser.pull.duration,
				})
			}),
		}))
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

		const info = dataGroup.data.map(datum => ({
			label: datum.label,
			colour: datum.colour,
			..._.findLast(datum.data, datum => datum.time <= timestamp),
		}))

		return info
	}
}
