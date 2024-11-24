import {Trans} from '@lingui/react'
import Color from 'color'
import {ScaleTime, scaleUtc} from 'd3-scale'
import {Resource} from 'event'
import _ from 'lodash'
import {Analyser, AnalyserOptions} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import {SimpleItem, SimpleRow, Timeline} from 'parser/core/modules/Timeline'
import React, {ReactNode} from 'react'
import {CounterResourceData} from '../Gauge/CounterGauge'
import {EnumResourceData} from '../Gauge/EnumGauge'
import {SetEnumResourceData} from '../Gauge/SetEnumGauge'
import {SetResourceData} from '../Gauge/SetGauge'
import {TimerResourceData} from '../Gauge/TimerGauge'
import {Graph} from './Graph'
import {MarkerHandler, ResourceInfo} from './MarkerHandler'

export interface ResourceMeta {
	label: ReactNode
	colour: string | Color
	linear?: boolean
	tooltipHideWhenEmpty?: boolean
	tooltipHideMaximum?: boolean
}

export interface ResourceDatum extends Resource {
	time: number
	base?: number
}

export interface ResourceDataCommon extends ResourceMeta {
	data: ResourceDatum[]
}

export type TypedResourceData =
	| CounterResourceData
	| TimerResourceData
	| VariableResourceData
	| SetResourceData
	| EnumResourceData
	| SetEnumResourceData

export interface ResourceData extends ResourceDataCommon {
	type: ResourceDataTypes
}
export interface ResourceDataGroup {
	data: TypedResourceData[]
	row: SimpleRow
	tooltipHideWhenEmpty?: boolean
}

export type ResourceDataTypes =
	| 'area'
	| 'variablearea'
	| 'shared'
	| 'discrete'

export interface VariableResourceData extends ResourceData {
	type: 'variablearea'
}

export interface ResourceGraphOptions {
	/** The handle of the timeline group to display this gauge data in. If not passed, will use the default "Gauges" group */
	handle?: string
	/** The color to draw the data set in. Will default to black if not specified */
	color?: string | Color
	/** The label to display for this group of data */
	label: ReactNode,
	/** Should this group default to collapsed? If not included, the default is yes */
	collapse?: boolean,
	/** Should this group be forced to remain collapsed. If not included, the default is no */
	forceCollapsed?: boolean
	/** The height of the row for the group. If not included, defaults to 64 px */
	height?: number
	/* Set to affect the relative order of the resource in the graph. */
	order?: number
	/* Set to hide the resource from the timeline tooltip when the resource's value is 0 */
	tooltipHideWhenEmpty?: boolean
	/* Set to hide the maximum value of this resource from the tooltip's denominator */
	tooltipHideMaximum?: boolean
}

export const DEFAULT_ROW_HEIGHT: number = 64

export interface ResourceGroupOptions extends ResourceGraphOptions {
	/** The handle for this group of data */
	handle: string,
}

export const RESOURCE_HANDLE: string = 'resources'
export const GAUGE_HANDLE: string = 'gauges'

// Recommended to apply a fade of at least 25% to colors used for the gauge, so the vertical dividers for time slices can still be seen through them
export const GAUGE_FADE: number = 0.25

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
	public addResource(resource: ResourceDataCommon) {
		this.addData(RESOURCE_HANDLE, {type: 'variablearea', ...resource})
	}

	/**
	 * Shorthand accessor for addData with the default gauges group, creating the group if necessary
	 * @param gauge The gauge ResourceData to add
	 * @param opts The ResourceGroupOptions defining this group
	 */
	public addGauge(gauge: TypedResourceData, opts?: ResourceGroupOptions) {
		let gaugeGroup = this.dataGroups.get(GAUGE_HANDLE)
		if (gaugeGroup == null) {
			if (opts == null) { return } // Can't add a missing group if no options provided...

			gaugeGroup = this.addDataGroup({
				...opts,
				handle: GAUGE_HANDLE,
				label: <Trans id="core.resource-graphs.gauge-label">Gauges</Trans>,
				order: 99, // This will put it right on top of the raid buffs row
			})
		}

		this.addData(GAUGE_HANDLE, gauge)
	}

	/**
	 * Adds a new data group and displays it on the timeline. Updates the group if already present and allowUpdate isn't false
	 * @param opts The ResourceGroupOptions defining this group
	 * @returns A reference to the ResourceDataGroup that was added or updated
	 */
	public addDataGroup(opts: ResourceGroupOptions): ResourceDataGroup {
		const {handle, label, collapse, forceCollapsed, height, order, tooltipHideWhenEmpty} = opts
		const resourceGroup: ResourceDataGroup = this.dataGroups.get(handle) ?? {
			data: [],
			row: new SimpleRow({
				label,
				// eslint-disable-next-line @typescript-eslint/no-magic-numbers
				order: -200 + (order ?? 0),
				height: (height ?? DEFAULT_ROW_HEIGHT),
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
			}),
			tooltipHideWhenEmpty,
		}

		if (!this.dataGroups.has(handle)) {
			this.timeline.addRow(resourceGroup.row)
			this.dataGroups.set(handle, resourceGroup)
		} else {
			resourceGroup.row.collapse = collapse ?? resourceGroup.row.collapse
			resourceGroup.row.height = height ?? resourceGroup.row.height
			resourceGroup.row.forceCollapsed = forceCollapsed ?? resourceGroup.row.forceCollapsed
		}
		return resourceGroup
	}

	/**
	 * Adds one ResourceData object to the specified group
	 * @param handle The handle of the group to add this data to
	 * @param data The ResourceData object to add to the group
	 */
	public addData(handle: string, resource: TypedResourceData): void {
		const dataGroup = this.dataGroups.get(handle)
		if (dataGroup == null) {
			return
		}

		dataGroup.data.push(resource)

		// Add a row for the graph - we only need a single item per resource, as the graph is the full duration.
		// TODO: Keep an eye on performance of this. If this chews resources too much, it should be
		// relatively simple to slice the graph into multiple smaller items which can be windowed.
		dataGroup.row.addRow(new SimpleRow({
			label: resource.label,
			height: (dataGroup.row.height ?? DEFAULT_ROW_HEIGHT),
			items: [new SimpleItem({
				content: <Graph resource={resource} scaleX={this.scaleX}/>,
				start: 0,
				end: this.parser.pull.duration,
			})],
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
				tooltipHideWhenEmpty: datum.tooltipHideWhenEmpty,
				tooltipHideMaximum: datum.tooltipHideMaximum,
			})
		}).filter(ri => !((ri.current == null || ri.current === 0) && ri.tooltipHideWhenEmpty === true)) // Remove resources that are empty if they're flagged for hiding from the tooltip
		if (dataGroup.tooltipHideWhenEmpty && !info.some(ri => (ri.current ?? 0) > 0)) { return [] } // If the group should be hidden from the tooltip when all resources are 0, return an empty array
		return info
	}
}
