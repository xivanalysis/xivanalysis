import {ScaleTime, scaleUtc} from 'd3-scale'
import {timeMinute, timeSecond} from 'd3-time'
import {utcFormat} from 'd3-time-format'
import React, {createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {useWheel} from 'react-use-gesture'
import styles from './Component.module.css'

type Scale = ScaleTime<number, number>

const ScaleContext = createContext<Scale>(scaleUtc())

// TODO: Should? be able to remove this if I make module output a proper component
// TODO: Look into cleaner implementations
export type SetViewFn = React.Dispatch<React.SetStateAction<[number, number]>>
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
				<Item value={741}>Test 1</Item>
			</Row>
			<Row>
				<Item value={1563}>Test 2</Item>
			</Row>
			<Item value={5341}>Test 3</Item>
		</Container>
		<Axis/>
	</ScaleHandler>
)

interface ScaleHandlerProps {
	min: number
	max: number

	exposeSetView?: ExposeSetViewFn
}

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
	const bind = useWheel(({delta: [_, deltaY], event}) => {
		setUserDomain(([uMin, uMax]) => [
			uMin,
			Math.max(Math.min(uMax + deltaY * 10, max), 1),
		])

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

interface ItemProps {
	// TODO: Need start/end value handling too tbh
	value: Parameters<Scale>[0]
}

const Item = ({value, children}: PropsWithChildren<ItemProps>) => {
	const scale = useContext(ScaleContext)

	const left = scale(value)

	// If the item would be out of the current bounds, don't bother rendering it
	// TODO: also left container side once I get panning going etc
	if (left > 100) {
		return null
	}

	return (
		<div className={styles.item} style={{left: `${left}%`}}>
			{children}
		</div>
	)
}

const Axis = () => {
	const scale = useContext(ScaleContext)

	return (
		<Row>
			{scale.ticks().map((tick, index) => (
				<Item key={index} value={tick}>
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
