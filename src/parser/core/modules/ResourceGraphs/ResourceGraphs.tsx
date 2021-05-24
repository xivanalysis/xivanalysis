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

export class ResourceGraphs extends Analyser {
	static handle = 'resourceGraphs'

	@dependency private timeline!: Timeline

	private resources: ResourceData[] = []
	private gauges: ResourceData[] = []
	private resourcesRow: SimpleRow
	private gaugesRow!: SimpleRow | null
	private scaleX: ScaleTime<number, number>

	constructor(...args: AnalyserOptions) {
		super(...args)

		this.resourcesRow = this.timeline.addRow(new SimpleRow({
			label: <Trans id="core.resource-graphs.row-label">Resources</Trans>,
			order: -200,
			height: 64,
			collapse: true,

			items: [new SimpleItem({
				content: <MarkerHandler getResources={this.getResources}/>,
				start: 0,
				end: this.parser.pull.duration,
				// Forcing this item above other items in its row, such that the line
				// marker is always above all graphs
				depth: 1,
			})],
		}))

		const {timestamp, duration} = this.parser.pull

		this.scaleX = scaleUtc()
			.domain([timestamp, timestamp + duration])
			.range([0, 1])
	}

	addResource(resource: ResourceData) {
		this.addResources(resource.label, [resource])
	}

	addResources(label: ReactNode, resources: ResourceData[]) {
		resources.forEach(resource => this.resources.push(resource))

		this.addDataToRow(this.resourcesRow, label, resources)
	}

	addGauge(gauge: ResourceData) {
		this.addGauges(gauge.label, [gauge])
	}

	addGauges(label: ReactNode, gauges: ResourceData[]) {
		gauges.forEach(gauges => this.gauges.push(gauges))

		if (this.gaugesRow == null) {
			this.gaugesRow = this.timeline.addRow(new SimpleRow({
				label: <Trans id="core.resource-graphs.gauge-label">Gauges</Trans>,
				order: -199, // This should come after the HP/MP graph
				height: 64,
				collapse: true,
				items: [new SimpleItem({
					content: <MarkerHandler getResources={this.getGauges}/>,
					start: 0,
					end: this.parser.pull.duration,
					// Forcing this item above other items in its row, such that the line
					// marker is always above all graphs
					depth: 1,
				})],
			}))
		}

		this.addDataToRow(this.gaugesRow, label, gauges)
	}

	// Add a row for the graph - we only need a single item per resource, as the graph is the full duration.
	// TODO: Keep an eye on performance of this. If this chews resources too much, it should be
	// relatively simple to slice the graph into multiple smaller items which can be windowed.
	private addDataToRow(row: SimpleRow, label: ReactNode, data: ResourceData[]) {
		row.addRow(new SimpleRow({
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

	private getResources = (fightPercent: number): ResourceInfo[] => {
		return this.getData(fightPercent, this.resources)
	}
	private getGauges = (fightPercent: number): ResourceInfo[] => {
		return this.getData(fightPercent, this.gauges)
	}
	private getData(fightPercent: number, data: ResourceData[]): ResourceInfo[] {
		const {duration, timestamp: pullTimestamp} = this.parser.pull
		const timestamp = pullTimestamp + (duration * fightPercent)

		const info = data.map(datum => ({
			label: datum.label,
			colour: datum.colour,
			..._.findLast(datum.data, datum => datum.time <= timestamp),
		}))

		return info
	}
}
