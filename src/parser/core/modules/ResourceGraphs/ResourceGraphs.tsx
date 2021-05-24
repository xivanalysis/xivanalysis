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

export class ResourceGraphs extends Analyser {
	static handle = 'resourceGraphs'

	@dependency private timeline!: Timeline

	private scaleX: ScaleTime<number, number>

	private dataGroups: Map<string, ResourceDataGroup> = new Map()

	constructor(...args: AnalyserOptions) {
		super(...args)

		this.addDataGroup('resources', <Trans id="core.resource-graphs.row-label">Resources</Trans>)
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
		this.addData('resources', resource.label, [resource])
	}

	/**
	 * Shorthand accessor for addData with the default resources group, if adding data to display on the same sub-row
	 * @param label The sub-row label
	 * @param resources The array of ResourceData to add
	 */
	public addResources(label: ReactNode, resources: ResourceData[]) {
		this.addData('resources', label, resources)
	}

	/**
	 * Shorthand accessor for addData with the default gauges group, creating the group if necessary
	 * @param gauge The gauge ResourceData to add
	 */
	public addGauge(gauge: ResourceData) {
		this.addGauges(gauge.label, [gauge])
	}

	/**
	 * Shorthand accessor for addData with the default resources group, if adding data to display on the same sub-row, creating the group if necessary
	 * @param label The sub-row label
	 * @param gauges The array of gauge ResourceData to add
	 */
	public addGauges(label: ReactNode, gauges: ResourceData[]) {
		let gaugeGroup = this.dataGroups.get('gauges')
		if (!gaugeGroup) {
			gaugeGroup = this.addDataGroup('gauges', <Trans id="core.resource-graphs.gauge-label">Gauges</Trans>)
		}

		this.addData('gauges', label, gauges)
	}

	/**
	 * Adds a new data group and displays it on the timeline
	 * @param handle The handle for this data group
	 * @param label The label to display for this group
	 * @returns A reference to the ResourceDataGroup that was added
	 */
	public addDataGroup(handle: string, label: ReactNode): ResourceDataGroup {
		const resourceRow = new SimpleRow({
			label,
			order: -200,
			height: 64,
			collapse: true,
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
		const resourceData = {data: [],
			row: resourceRow,
		}
		this.dataGroups.set(handle, resourceData)
		return resourceData
	}

	/**
	 * Adds data to the specified group, creating the group if necessary
	 * @param handle The handle of the group to add this data to
	 * @param label The label for this data within the group. Will also be the label for the group if the group did not previously exist
	 * @param data The array of data to add to the group
	 */
	public addData(handle: string, label: ReactNode, data: ResourceData[]) {
		let dataGroup = this.dataGroups.get(handle)
		if (!dataGroup) {
			dataGroup = this.addDataGroup(handle, label)
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
