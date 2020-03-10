import {ScaleTime, scaleUtc} from 'd3-scale'
import {timeMinute, timeSecond} from 'd3-time'
import {utcFormat} from 'd3-time-format'
import _ from 'lodash'
import React, {createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState} from 'react'
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

export const Component = ({
	min = 0,
	max = 1000, // Infinity,
	exposeSetView,
}: ComponentProps) => (
	<ScaleHandler min={min} max={max} exposeSetView={exposeSetView}>
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
)

interface ScaleHandlerProps {
	min: number
	max: number

	exposeSetView?: ExposeSetViewFn
}

// Helper functions for modifying the user domain
// TODO: These need to use %s for scales on the delta because direct 1:1 is jank af
// TODO: probably should calc delta in the wheel handler, and just act on a single value in these
const pan = ({delta: [, dY], min, max}: {delta: Vector2, min: number, max: number}) =>
	([uMin, uMax]: Vector2): Vector2 => {
		const dist = uMax - uMin
		return [
			_.clamp(uMin + dY, min, max - dist),
			_.clamp(uMax + dY, min + dist, max),
		]
	}

const zoom = ({delta: [, dY], max}: {delta: Vector2, max: number}) =>
	([uMin, uMax]: Vector2): Vector2 => [
		uMin,
		_.clamp(uMax + dY * 10, uMin + 1, max),
	]

function ScaleHandler({
	children,
	min,
	max,
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

	const scrollParentRef = useRef(null)
	const bind = useWheel(({delta, ctrlKey, event}) => {
		const action = ctrlKey
			? zoom({delta, max})
			: pan({delta, min, max})
		setUserDomain(action)

		event?.preventDefault()
	}, {
		domTarget: scrollParentRef,
		eventOptions: {passive: false},
	})
	useEffect(bind, [bind])

	return (
		<div ref={scrollParentRef} className={styles.scaleHandler}>
			<ScaleContext.Provider value={scale}>
				{children}
			</ScaleContext.Provider>
		</div>
	)
}

const Container = ({children}: PropsWithChildren<{}>) => (
	<div className={styles.container}>
		{children}
	</div>
)

// TODO: Row is only seperate from Container as I'm expecting Row will have a bunch of special handling for the key down the left.
// If that isn't the case, one of the two can be removed.
const Row = ({children}: PropsWithChildren<{}>) => (
	<div className={styles.row}>
		{children}
	</div>
)

type ItemProps =
	| {time: Scalable, start?: never, end?: never}
	| {time?: never, start: Scalable, end: Scalable}

const Item = (props: PropsWithChildren<ItemProps>) => {
	const scale = useContext(ScaleContext)

	const left = scale(props.time ?? props.start)
	const right = props.end && scale(props.end)

	// If the item would be out of the current bounds, don't bother rendering it
	// TODO: also left container side once I get panning going etc
	if (left > 100) {
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
}

const Axis = () => {
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
}

const formatTick = (date: Date) => (
	timeSecond(date) < date ? utcFormat('.%L') :
	timeMinute(date) < date ? utcFormat('%-S') :
	utcFormat('%-Mm')
)(date)
