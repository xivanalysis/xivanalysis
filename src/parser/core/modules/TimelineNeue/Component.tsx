import {ScaleTime, scaleUtc} from 'd3-scale'
import {timeMinute, timeSecond} from 'd3-time'
import {utcFormat} from 'd3-time-format'
import _ from 'lodash'
import React, {createContext, memo, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {useWheel} from 'react-use-gesture'
import styles from './Component.module.css'

type Scale = ScaleTime<number, number>
type Scalable = Parameters<Scale>[0]

type Vector2 = [number, number]

const ScaleContext = createContext<Scale>(scaleUtc())

// TODO: Should? be able to remove this if I make module output a proper component
// TODO: Look into cleaner implementations
export type SetViewFn = React.Dispatch<React.SetStateAction<Vector2>>
type ExposeSetViewFn = (setter: SetViewFn) => void

export interface ComponentProps {
	/** Minimum bound of time region to display. */
	min?: number
	/** Maximum bound of time region to display. */
	max?: number

	/**
	 * If provided, will be called with a function that can be used to adjust
	 * the displayed view of the domain.
	 */
	exposeSetView?: ExposeSetViewFn
}

export const Component = memo(({
	min = 0,
	max = 1000, // Infinity,
	exposeSetView,
}: ComponentProps) => (
	<ScaleHandler
		min={min}
		max={max}
		zoomMin={10000}
		exposeSetView={exposeSetView}
	>
		<Container>
			<Row>
				<Item time={741}>Test 1</Item>
			</Row>
			<Row>
				<Item start={1563} end={4123}>Test 2</Item>
			</Row>
			<Item time={5341}>Test 3</Item>
		</Container>
		<Axis/>
	</ScaleHandler>
))

// TODO: docs
interface ScaleHandlerProps {
	min: number
	max: number
	zoomMin?: number

	exposeSetView?: ExposeSetViewFn
}

function ScaleHandler({
	children,
	min,
	max,
	zoomMin = 1,
	exposeSetView,
}: PropsWithChildren<ScaleHandlerProps>) {
	// State of the current domain, selected via pan/zoom by the user
	const [userDomain, setUserDomain] = useState<[number, number]>([min, max])

	// If able, expose our user domain setter so external code can adjust it
	useEffect(
		() => exposeSetView?.(setUserDomain),
		[exposeSetView],
	)

	// Keep the scale up to date with the user's domain
	// TODO: Keep an eye on the perf here. I don't like regenning the scale every time, but it's
	//       the easiest way to cascade updates over the context. It... should be fine?
	const scale = useMemo(
		() => scaleUtc().range([0, 100]).domain(userDomain),
		[userDomain],
	)

	// Ref that will be populated with the scroll parent element. We need access to this for some
	// event binds, and location calculations
	const scrollParentRef = useRef<HTMLDivElement>(null)

	// Capture and store the mouse's position as a pct - we'll use this to handle zooming at the cursor position.
	const zoomCentre = useRef<number>(0)
	const onMouseMove = useCallback((event: React.MouseEvent) => {
		// If there's no reference to the scroll parent yet, stop short
		const {current: scrollParent} = scrollParentRef
		if (scrollParent == null) { return }

		// TODO: this isn't great - cache somehow?
		// We're only using X - zoom is only on the X axis, so Y is unused
		const {x: elemX, width} = scrollParent.getBoundingClientRect()

		zoomCentre.current = _.clamp((event.clientX - elemX) / width, 0, 1)
	}, [])

	// Helper functions for modifying the user domain
	// TODO: These need to use %s for scales on the delta because direct 1:1 is jank af
	// TODO: probably should calc delta in the wheel handler, and just act on a single value in these
	// TODO: ...should I just pull in d3-zoom and call it a day? It'd be kind of disgusting and I'd still need to bind
	//       via a ref, but...
	const pan = useCallback(
		({delta: [, dY]}: {delta: Vector2}) => {
			return ([uMin, uMax]: Vector2): Vector2 => {
				const dist = uMax - uMin
				return [
					_.clamp(uMin + dY, min, max - dist),
					_.clamp(uMax + dY, min + dist, max),
				]
			}
		},
		[min, max],
	)

	const zoom = useCallback(
		({delta: [, dY], centre}: {delta: Vector2, centre: number}) => {
			return ([uMin, uMax]: Vector2): Vector2 => {
				const zoomBy = dY * 10
				const newMin = _.clamp(uMin - zoomBy * centre, min, uMax - zoomMin)
				const newMax = _.clamp(uMax + zoomBy * (1 - centre), newMin + zoomMin, max)
				return [newMin, newMax]
			}
		},
		[min, max, zoomMin],
	)

	const bind = useWheel(({delta, ctrlKey, event}) => {
		const action = ctrlKey
			? zoom({delta, centre: zoomCentre.current})
			: pan({delta})
		setUserDomain(action)

		event?.preventDefault()
	}, {
		domTarget: scrollParentRef,
		eventOptions: {passive: false},
	})
	useEffect(bind, [bind])

	return (
		<div ref={scrollParentRef} className={styles.scaleHandler} onMouseMove={onMouseMove}>
			<ScaleContext.Provider value={scale}>
				{children}
			</ScaleContext.Provider>
		</div>
	)
}

const Container = memo(({children}: PropsWithChildren<{}>) => (
	<div className={styles.container}>
		{children}
	</div>
))

// TODO: Row is only seperate from Container as I'm expecting Row will have a bunch of special handling for the key down the left.
// If that isn't the case, one of the two can be removed.
const Row = memo(({children}: PropsWithChildren<{}>) => (
	<div className={styles.row}>
		{children}
	</div>
))

type ItemProps =
	| {time: Scalable, start?: never, end?: never}
	| {time?: never, start: Scalable, end: Scalable}

const Item = memo((props: PropsWithChildren<ItemProps>) => {
	const scale = useContext(ScaleContext)

	const left = scale(props.time ?? props.start)
	const right = props.end && scale(props.end)

	// If the item would be out of the current bounds, don't bother rendering it
	// TODO: handle left side culling for items with no definitive `right` value
	if (
		left > 100 ||
		(right && right < 0)
	) {
		return null
	}

	const style = {
		left: `${left}%`,
		...right && {width: `${right - left}%`},
	}

	return (
		<div className={styles.item} style={style}>
			{props.children}
		</div>
	)
})

const Axis = memo(() => {
	const scale = useContext(ScaleContext)

	return (
		<Row>
			{scale.ticks().map((tick, index) => (
				<Item key={index} time={tick}>
					{formatTick(tick)}
				</Item>
			))}
		</Row>
	)
})

const formatTick = (date: Date) => (
	timeSecond(date) < date ? utcFormat('.%L') :
	timeMinute(date) < date ? utcFormat('%-S') :
	utcFormat('%-Mm')
)(date)
