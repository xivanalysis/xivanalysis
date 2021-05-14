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
	static override handle = 'resourceGraphs'

	@dependency private timeline!: Timeline

	private resources: ResourceData[] = []
	private parentRow: SimpleRow
	private scaleX: ScaleTime<number, number>

	constructor(...args: AnalyserOptions) {
		super(...args)

		this.parentRow = this.timeline.addRow(new SimpleRow({
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
		this.resources.push(resource)

		// Add a row for the graph - we only need a single item, as the graph is the full duration.
		// TODO: Keep an eye on performance of this. If this chews resources too much, it should be
		// relatively simple to slice the graph into multiple smaller items which can be windowed.
		this.parentRow.addRow(new SimpleRow({
			label: resource.label,
			height: 64,
			items: [new SimpleItem({
				content: <Graph resource={resource} scaleX={this.scaleX}/>,
				start: 0,
				end: this.parser.pull.duration,
			})],
		}))
	}

	private getResources = (fightPercent: number): ResourceInfo[] => {
		const {duration, timestamp: pullTimestamp} = this.parser.pull
		const timestamp = pullTimestamp + (duration * fightPercent)

		const resources = this.resources.map(resource => ({
			label: resource.label,
			colour: resource.colour,
			..._.findLast(resource.data, datum => datum.time <= timestamp),
		}))

		return resources
	}
}
