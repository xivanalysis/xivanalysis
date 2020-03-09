import {scaleTime} from 'd3-scale'
import {timeMinute, timeSecond} from 'd3-time'
import {utcFormat} from 'd3-time-format'
import React, {useCallback, useMemo, useRef, useState} from 'react'

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
		scaleTime().range([0, 100]).domain([min, max]),
	)

	// State of the current user domain
	const [userDomain, setUserDomain] = useState([min, max])

	const ticks = useMemo(() => {
		scale.domain(userDomain)
		return scale.ticks()
	}, userDomain)

	// Need to use a manual event for this, as react hooks _all_ events on doc root, and the chrome
	// team in their infinite wisdom or lack thereof has made wheel events on the root passive by
	// default. Oh, and react doesn't let you change that.
	const scrollParentRef = useEventListener('wheel', useCallback(event => {
		// TODO: This, but better
		setUserDomain(([uMin, uMax]) => [
			uMin,
			Math.max(Math.min(uMax + event.deltaY, max), 0),
		])
		event.preventDefault()
	}, [max]))

	return (
		<div ref={scrollParentRef} style={{border: '1px dashed red'}}>
			bounds: {userDomain.join(', ')}

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

/**
 * Hook an event listener directly onto an element, bypassing react's synthetic event system.
 * If you're not sure if you need this, you don't need it.
 *
 * @param type Event type to hook into
 * @param listener Listener to attach
 * @returns Callback ref that should be passed to the `ref` prop on the element to be listened on
 */
function useEventListener<E extends keyof HTMLElementEventMap>(type: E, listener: (event: HTMLElementEventMap[E]) => void) {
	const ref = useRef<HTMLElement | null>(null)

	const setRef = useCallback((node: HTMLElement | null) => {
		if (ref.current != null) {
			ref.current.removeEventListener(type, listener)
		}

		if (node != null) {
			node.addEventListener(type, listener)
		}

		ref.current = node
	}, [type, listener])

	return setRef
}
