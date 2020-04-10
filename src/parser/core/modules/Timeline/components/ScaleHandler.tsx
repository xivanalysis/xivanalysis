import {ScaleTime, scaleUtc} from 'd3-scale'
import _ from 'lodash'
import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'
import Measure, {BoundingRect, ContentRect, MeasureProps} from 'react-measure'
import {useGesture} from 'react-use-gesture'
import {UseGestureEvent} from 'react-use-gesture/dist/types'

export type Scale = ScaleTime<number, number>
export type Scalable = Parameters<Scale>[0]

type Vector2 = [number, number]

type MeasureChildren = MeasureProps['children']

const ScaleContext = createContext<Scale>(scaleUtc())
export const useScale = () => useContext(ScaleContext)

// TODO: Should? be able to remove this if I make module output a proper component
export type SetViewFn = (view: Vector2) => void
export type ExposeSetViewFn = (setter: SetViewFn) => void

export interface ScaleHandlerProps {
	/** Minimum bound of time region to display. */
	min: number
	/** Maximum bound of time region to display. */
	max: number
	/** Start point of initial time region displayed. Defaults to min. */
	start?: number
	/** End point of initial time region displayed. Defaults to max. */
	end?: number
	/** Minimum time duration to display. */
	zoomMin?: number
	/** Factor used to determine distance moved when panning with indirect inputs. Defaults to 0.05 (5%). */
	panFactor?: number
	/** Factor used to determine distance zoomed with indirect inputs. Defaults to 0.2 (20%). */
	zoomFactor?: number

	/**
	 * If provided, will be called with a function that can be used to adjust
	 * the displayed view of the domain.
	 */
	exposeSetView?: ExposeSetViewFn
}

export interface InternalScaleHandlerProps extends ScaleHandlerProps {
	children: MeasureChildren
}

const DEFAULT_PAN_FACTOR = 0.05
const DEFAULT_ZOOM_FACTOR = 0.2

/**
 * We can't prevent default on touch events, as their default is _required_ to
 * execute before non-touch events such as click fire. Handle it.
 */
function preventMouseEventDefault(event?: UseGestureEvent) {
	if (event == null || event.type.includes('touch')) { return }
	event.preventDefault()
}

// Different browsers and devices report deltas in different manners. Try to normalise the values.
// These constants are copied from vis, which in turn copies them from a vast array of similar mouse
// handling code in the wild. I trust it... kinda.
const LINE_HEIGHT = 40
const PAGE_HEIGHT = 800
const PIXEL_DIVISOR = 120

enum DeltaMode {
	PIXEL = 0,
	LINE = 1,
	PAGE = 2,
}

const multipliers = new Map([
	[DeltaMode.LINE, LINE_HEIGHT],
	[DeltaMode.PAGE, PAGE_HEIGHT],
])

function normaliseWheelDelta(deltaMode: number, delta: number) {
	const multiplier = multipliers.get(deltaMode) ?? 1
	return (delta * multiplier) / PIXEL_DIVISOR
}

// I shouldn't need this but I do so here we are
const isWheelEvent = (event: UseGestureEvent): event is React.WheelEvent =>
	event.type === 'wheel'

export function ScaleHandler({
	children,
	min,
	max,
	start,
	end,
	zoomMin = 1,
	panFactor = DEFAULT_PAN_FACTOR,
	zoomFactor = DEFAULT_ZOOM_FACTOR,
	exposeSetView,
}: InternalScaleHandlerProps) {
	// States representing the scale's range & domain
	// TODO: Should I just put the entire scale in the state and be done with it?
	const [domain, setDomain] = useState<Vector2>([start ?? min, end ?? max])
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

	// TODO: Keep an eye on the perf here. I don't like regenning the scale every time, but it's
	//       the easiest way to cascade updates over the context. It... should be fine?
	// Primary scale for converting times to screen pixels
	const scale = useMemo(
		() => scaleUtc().range(range).domain(domain),
		[range, domain],
	)
	const domainDistance = domain[1] - domain[0]
	// Delta scale maintains the primary scale's domain's distance, but zeroed such that delta values can be calculated,
	const deltaScale = useMemo(
		() => scaleUtc().range(range).domain([0, domainDistance]),
		[range, domainDistance],
	)

	// Ref that will be populated with the scroll parent element. We need access to this for some
	// event binds, and location calculations
	const scrollParentRef = useRef<HTMLDivElement>(null)

	// Track the current scroll parent bounds, we use this to calculate the mouse position and the range of the scale
	const contentBounds = useRef<BoundingRect>()
	const onContentResize = useCallback(({bounds}: ContentRect) => {
		contentBounds.current = bounds
		if (bounds?.width != null) { setRange([0, bounds.width])}
	}, [])

	// Helper functions for modifying the user domain
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
				const newMin = _.clamp(uMin - delta * centre, min, uMax - zoomMin)
				const newMax = _.clamp(uMax + delta * (1 - centre), newMin + zoomMin, max)
				return [newMin, newMax]
			})
		},
		[min, max, zoomMin],
	)

	// Need to set generic explicitly so TS types the return value correctly
	const gestureConfig = {
		domTarget: scrollParentRef,
		eventOptions: {passive: false},
		drag: {axis: 'x'},
	} as const
	const bindGestures = useGesture<typeof gestureConfig>({
		// TODO: Test this on a touchpad
		onWheel: ({delta: [dX, dY], direction: [dirX, dirY], event}) => {
			preventMouseEventDefault(event)

			// Get the larger of the two deltas. If it's 0, we don't want to do anything.
			const maxDelta = Math.abs(dX) > Math.abs(dY) ? dX : dY
			if (maxDelta === 0) { return }

			// If the wheel event is a wheel event (really, use-gesture?), try to normalise the delta
			const finalDelta = event != null && isWheelEvent(event)
				? normaliseWheelDelta(event.deltaMode, maxDelta)
				: maxDelta

			// Normalise the movement to a %age of the domain & pan
			pan({delta: finalDelta * domainDistance * panFactor})
		},
		// TODO: Test this on a touchpad
		onPinch: ({delta: [dX, dY], touches, origin, event}) => {
			// Can't not cancel touch events on pinch, as we'll get full page zoom. Can't cancel, as it
			// kills clicks. Delta is 0,0 on first tick (including click!?), which isn't really useful
			// as a pinch - bail early in that instance to avoid PD on clicks.
			if ((dX === 0 && dY === 0) || origin == null) { return }
			event?.preventDefault()

			// Calc the zoom centre as a %age of the range
			const [oX] = origin
			const {left = 0, width = 1} = contentBounds.current ?? {} as Partial<BoundingRect>
			const centre = _.clamp((oX - left) / width, 0, 1)

			// If there's touches, calculate zoom based on the X-axis delta
			if (touches > 0) {
				zoom({delta: -(deltaScale.invert(dX).getTime() * 2), centre})
				return
			}

			// No touches, so probably mouse events. Delta is pretty arbitrary, so calc our own factor.

			// Direction sticks around a bit too long. Calc our own.
			const scale = (dY / Math.abs(dY)) * zoomFactor

			// We want zooming in to step at the same rate as zooming out, adjust the scale to ensure that.
			const adjustedScale = scale > 0 ? scale : scale / (Math.abs(scale) + 1)
			zoom({delta: domainDistance * adjustedScale, centre})
		},
		onDrag: ({delta: [dX], event}) => {
			preventMouseEventDefault(event)
			pan({delta: -deltaScale.invert(dX).getTime()})
		},
	}, gestureConfig)
	useEffect(bindGestures, [bindGestures])

	return (
		<div ref={scrollParentRef}>
			<ScaleContext.Provider value={scale}>
				<Measure bounds onResize={onContentResize}>{children}</Measure>
			</ScaleContext.Provider>
		</div>
	)
}
