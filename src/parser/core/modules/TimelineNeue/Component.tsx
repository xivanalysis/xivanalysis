import {scaleTime} from 'd3-scale'
import {timeMinute, timeSecond} from 'd3-time'
import {utcFormat} from 'd3-time-format'
import React, {useMemo, useRef} from 'react'

export interface ComponentProps {
	/** Minimum bound of time region to display. */
	min?: number
	/** Maximum bound of time region to display. */
	max?: number
}

const formatTick = (date: Date) => (
	timeSecond(date) < date ? utcFormat('.%L') :
	timeMinute(date) < date ? utcFormat('%-S') :
	utcFormat('%-Mm')
)(date)

export const Component = ({
	min = 0,
	max = 1000, // Infinity,
}: ComponentProps) => {
	// Build the initial scale object. Using `useRef` so we don't keep building new scales
	const {current: scale} = useRef(
		scaleTime().range([0, 100]),
	)

	// This is pretty meme ngl
	const ticks = useMemo(() => {
		scale.domain([min, max])

		return scale.ticks()
	}, [min, max])

	return (
		<div style={{border: '1px dashed red'}}>
			bounds: {min} - {max}

			{/* Main scrolling body */}
			<div>
				{/* Rows need to go here? */}
				{/* ... */}

				{/* Scale row */}
				<div style={{position: 'relative', height: '20px', border: '1px dotted blue'}}>
					{/* Ticks */}
					{ticks.map((tick, index) => (
						<div key={index} style={{position: 'absolute', left: scale(tick) + '%'}}>
							{formatTick(tick)}
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
