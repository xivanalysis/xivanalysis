import {scaleTime, ScaleTime} from 'd3-scale'
import {timeMinute, timeSecond} from 'd3-time'
import {utcFormat} from 'd3-time-format'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import styles from './Component.module.css'

export interface ComponentProps {
	/** Minimum bound of time region to display. */
	min?: number
	/** Maximum bound of time region to display. */
	max?: number
}

export function Component({
	min = 0,
	max = 1000, // Infinity,
}: ComponentProps) {
	// Build the initial scale object. Using `useRef` so we don't keep building new scales.
	const {current: scale} = useRef(
		scaleTime().range([0, 100]),
	)

	// State of the current user domain
	const [userDomain, setUserDomain] = useState([min, max])

	// Using memo for synchronous conditional update
	// TODO: Is the complexity from the above even worth it? Check what lifting d3 is doing here,
	// it may be just be overkill.
	useMemo(() => {
		scale.domain(userDomain)
	}, [userDomain])

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
		<div ref={scrollParentRef} className={styles.container}>
			{/* TODO: Group rows */}
			bounds: {userDomain.join(', ')}

			<Axis scale={scale}/>
		</div>
	)
}

interface AxisProps {
	scale: ScaleTime<number, number>
}

const Axis = ({scale}: AxisProps) => (
	<div className={styles.axis}>
		{scale.ticks().map((tick, index) => (
			<div key={index} className={styles.tick} style={{left: `${scale(tick)}%`}}>
				{formatTick(tick)}
			</div>
		))}
	</div>
)

const formatTick = (date: Date) => (
	timeSecond(date) < date ? utcFormat('.%L') :
	timeMinute(date) < date ? utcFormat('%-S') :
	utcFormat('%-Mm')
)(date)

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
