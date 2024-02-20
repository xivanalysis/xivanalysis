import {useId} from '@reach/auto-id'
import {PatternLines} from '@visx/pattern'
import {Area} from '@visx/shape'
import {scaleLinear, ScaleTime} from 'd3-scale'
import {curveLinear, curveStepAfter} from 'd3-shape'
import _ from 'lodash'
import React, {ReactNode} from 'react'
import {ResourceData} from './ResourceGraphs'
import styles from './ResourceGraphs.module.css'

export interface GraphProps {
	resource: ResourceData
	scaleX: ScaleTime<number, number>
}

export function Graph({resource, scaleX}: GraphProps) {
	const id = useId()

	// NOTE: This is currently only rendered once. If we ever start re-rendering
	// this frequently, a lot of the logic below should be memo'd.

	// Ensure there's a data point for the end of the fight to prevent an early drop off
	let data = resource.data

	if (data.length > 0) {
		const [, domainEndDate] = scaleX.domain()
		const domainEnd = domainEndDate.getTime()
		const lastDatum = data[data.length - 1]
		if (lastDatum.time < domainEnd) {
			data = [...data, {...lastDatum, time: domainEnd}]
		}
	}

	// Find the maximum value in the data and use it to build the Y axis scale
	const maximumY = _.maxBy(resource.data, x => x.maximum)?.maximum ?? 1
	const scaleY = scaleLinear()
		.domain([0, maximumY ?? 1])
		.range([1, 0])

	// Build the graph area for the current value
	const currentArea = <>
		<ClipPath id={`${id}-current-path`}>
			<Area
				data={data}
				curve={(resource.linear ?? false) ? curveLinear : curveStepAfter}
				x={datum => scaleX(datum.time)}
				y0={datum => scaleY(datum.base ?? 0)}
				y1={datum => scaleY((datum.base ?? 0) + datum.current)}
			/>
		</ClipPath>

		<Rect fill="currentColor" clipPath={`url(#${id}-current-path)`}/>
	</>

	// If the maximum value varies, build an area path for it
	let maximumArea: ReactNode
	const minimumMaximum = _.minBy(resource.data, x => x.maximum)?.maximum
	if (minimumMaximum !== maximumY) {
		maximumArea = <>
			<PatternLines
				id={`${id}-maximum-fill`}
				height={5}
				width={5}
				stroke="currentColor"
				strokeWidth={1}
				orientation={['diagonal']}
			/>

			<ClipPath id={`${id}-maximum-path`} >
				<Area
					data={data}
					curve={(resource.linear ?? false) ? curveLinear :curveStepAfter}
					x={datum => scaleX(datum.time)}
					y0={scaleY(maximumY)}
					y1={datum => scaleY(datum.maximum)}
				/>
			</ClipPath>

			<Rect fill={`url(#${id}-maximum-fill)`} clipPath={`url(#${id}-maximum-path)`}/>
		</>
	}

	return (
		<svg
			className={styles.graph}
			style={{color: resource.colour.toString()}}
		>
			{currentArea}
			{maximumArea}
		</svg>
	)
}

// Helpers to deduplicate markup above

interface ClipPathProps {
	id: string
	children?: ReactNode
}

const ClipPath = ({id, children}: ClipPathProps) => (
	<defs>
		<clipPath id={id} clipPathUnits="objectBoundingBox">
			{children}
		</clipPath>
	</defs>
)

interface RectProps {
	fill: string
	clipPath: string
}

const Rect = ({fill, clipPath}: RectProps) => (
	<rect
		x="0"
		y="0"
		width="100%"
		height="100%"
		fill={fill}
		clipPath={clipPath}
	/>
)
