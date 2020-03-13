import {ScaleTime, scaleUtc} from 'd3-scale'
import _ from 'lodash'
import React, {createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'
import Measure, {BoundingRect, ContentRect} from 'react-measure'
import {useGesture} from 'react-use-gesture'
import styles from './Component.module.css'

export type Scale = ScaleTime<number, number>
export type Scalable = Parameters<Scale>[0]

type Vector2 = [number, number]

const ScaleContext = createContext<Scale>(scaleUtc())
export const useScale = () => useContext(ScaleContext)

// TODO: Should? be able to remove this if I make module output a proper component
// TODO: Look into cleaner implementations
export type SetViewFn = (view: Vector2) => void
export type ExposeSetViewFn = (setter: SetViewFn) => void

export interface ScaleHandlerProps {
	/** Minimum bound of time region to display. */
	min: number
	/** Maximum bound of time region to display. */
	max: number
	/** Minimum time duration to display. */
	zoomMin?: number

	/**
	 * If provided, will be called with a function that can be used to adjust
	 * the displayed view of the domain.
	 */
	exposeSetView?: ExposeSetViewFn
}

export function ScaleHandler({
	children,
	min,
	max,
	zoomMin = 1,
	exposeSetView,
}: PropsWithChildren<ScaleHandlerProps>) {
	// States representing the scale's range & domain
	// TODO: Should I just put the entire scale in the state and be done with it?
	const [domain, setDomain] = useState<Vector2>([min, max])
	const [range, setRange] = useState<Vector2>([0, 100])

	// If able, expose our user domain setter so external code can adjust it
	const setView = useCallback(
		(view: Vector2) => {
			let [left, right] = view
			// Make sure the domain isn't flipped
			right = Math.max(left, right)

			// Make sure the domain isn't zoomed beyond zoomMin
			const additionalZoom = zoomMin - (right - left)
			if (additionalZoom > 0) {
				left = Math.max(left - additionalZoom / 2, min)
				right = Math.min(left + zoomMin, max)
			}

			setDomain([left, right])
		},
		[min, max, zoomMin],
	)
	useEffect(
		() => exposeSetView?.(setView),
		[setView, exposeSetView],
	)

	// Keep the scale up to date with the user's domain
	// TODO: Keep an eye on the perf here. I don't like regenning the scale every time, but it's
	//       the easiest way to cascade updates over the context. It... should be fine?
	const {scale, deltaScale} = useMemo(
		() => ({
			// Primary scale for converting times to screen pixels
			scale: scaleUtc().range(range).domain(domain),
			// Delta scale maintains the primary scale's domain's distance, but zeroed such that delta values can be calculated
			deltaScale: scaleUtc().range(range).domain([0, domain[1], - domain[0]]),
		}),
		[range, domain],
	)

	// Ref that will be populated with the scroll parent element. We need access to this for some
	// event binds, and location calculations
	const scrollParentRef = useRef<HTMLDivElement>(null)

	// Track the current scroll parent bounds, this is primarily used for calculating mouse position for zooming below
	const parentBounds = useRef<BoundingRect>()
	const onResize = useCallback(({bounds}: ContentRect) => {
		parentBounds.current = bounds
		if (bounds?.width != null) { setRange([0, bounds.width]) }
	}, [])

	// Capture and store the mouse's position as a pct - we'll use this to handle zooming at the cursor position.
	const zoomCentre = useRef(0)
	const onMouseMove = useCallback((event: React.MouseEvent) => {
		// If there's no reference to the scroll parent yet, stop short
		const {current: scrollParent} = scrollParentRef
		if (scrollParent == null) { return }

		// We're only using X - zoom is only on the X axis, so Y is unused
		const {left = 0, width = 1} = parentBounds.current ?? {} as Partial<BoundingRect>

		zoomCentre.current = _.clamp((event.clientX - left) / width, 0, 1)
	}, [])

	// Helper functions for modifying the user domain
	// TODO: These need to use %s for scales on the delta because direct 1:1 is jank af
	// TODO: ...should I just pull in d3-zoom and call it a day? It'd be kind of disgusting and I'd still need to bind
	//       via a ref, but...
	const pan = useCallback(
		({delta}: {delta: number}) => {
			setDomain(([uMin, uMax]): Vector2 => {
				const dist = uMax - uMin
				return [
					_.clamp(uMin + delta, min, max - dist),
					_.clamp(uMax + delta, min + dist, max),
				]
			})
		},
		[min, max],
	)

	const zoom = useCallback(
		({delta, centre}: {delta: number, centre: number}) => {
			setDomain(([uMin, uMax]): Vector2 => {
				const zoomBy = delta * 10
				const newMin = _.clamp(uMin - zoomBy * centre, min, uMax - zoomMin)
				const newMax = _.clamp(uMax + zoomBy * (1 - centre), newMin + zoomMin, max)
				return [newMin, newMax]
			})
		},
		[min, max, zoomMin],
	)

	// Need to set generic explicitly so TS types the return value correctly
	const gestureConfig = {
		domTarget: scrollParentRef,
		eventOptions: {passive: false},
	}
	const bindGestures = useGesture<typeof gestureConfig>({
		onWheel: ({delta: [, dY], event}) => {
			pan({delta: dY})
			event?.preventDefault()
		},
		onPinch: ({delta: [, dY], event}) => {
			zoom({delta: dY, centre: zoomCentre.current})
			event?.preventDefault()
		},
		onDrag: ({delta: [dX], event}) => {
			const distance = deltaScale.invert(dX).getTime()
			pan({delta: -distance})
			event?.preventDefault()
		},
		onMouseMove,
	}, gestureConfig)
	useEffect(bindGestures, [bindGestures])

	return (
		<Measure innerRef={scrollParentRef} bounds onResize={onResize}>
			{({measureRef}) => (
				<div ref={measureRef} className={styles.scaleHandler}>
					<ScaleContext.Provider value={scale}>
						{children}
					</ScaleContext.Provider>
				</div>
			)}
		</Measure>
	)
}
