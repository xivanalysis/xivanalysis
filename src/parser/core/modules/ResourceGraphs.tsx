import {Trans} from '@lingui/react'
import Color from 'color'
import {scaleLinear, ScaleTime, scaleUtc} from 'd3-scale'
import {area, curveStepAfter} from 'd3-shape'
import _ from 'lodash'
import React from 'react'
import {Analyser, AnalyserOptions} from '../Analyser'
import {dependency} from '../Injectable'
import {SimpleItem, SimpleRow, Timeline} from './Timeline'

export interface ResourceDatum {
	time: number
	value: number
}

export interface Resource {
	label: React.ReactNode
	colour: string | Color
	data: ResourceDatum[]
}

export class ResourceGraphs extends Analyser {
	static handle = 'resourceGraphs'

	@dependency private timeline!: Timeline

	private parentRow: SimpleRow
	private scaleX: ScaleTime<number, number>

	constructor(...args: AnalyserOptions) {
		super(...args)

		this.parentRow = this.timeline.addRow(new SimpleRow({
			label: <Trans id="core.resource-graphs.row-label">Resources</Trans>,
			order: -200,
			height: 64,
			collapse: true,
		}))

		const {timestamp, duration} = this.parser.pull

		this.scaleX = scaleUtc()
			.domain([timestamp, timestamp + duration])
			.range([0, 1])
	}

	addResource(resource: Resource) {
		const max = _.maxBy(resource.data, x => x.value)
		const scaleY = scaleLinear()
			.domain([0, max?.value ?? 1])
			.range([1, 0])

		const buildArea = area<ResourceDatum>()
			// TODO: Should this be configurable?
			.curve(curveStepAfter)
			.x(datum => this.scaleX(datum.time) ?? NaN)
			.y0(scaleY(0) ?? 0)
			.y1(datum => scaleY(datum.value) ?? 0)

		const content = (
			<svg
				viewBox="0 0 1 1"
				preserveAspectRatio="none"
				style={{width: '100%', height: '100%'}}
			>
				<path
					fill={resource.colour.toString()}
					d={buildArea(resource.data) ?? undefined}
				/>
			</svg>
		)

		this.parentRow.addRow(new SimpleRow({
			label: resource.label,
			height: 64,
			items: [new SimpleItem({
				content,
				start: 0,
				end: this.parser.pull.duration,
			})],
		}))
	}
}
