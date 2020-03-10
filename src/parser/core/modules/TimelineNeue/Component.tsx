import {scaleTime, ScaleTime} from 'd3-scale'
import {timeMinute, timeSecond} from 'd3-time'
import {utcFormat} from 'd3-time-format'
import React, {createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {useWheel} from 'react-use-gesture'
import styles from './Component.module.css'

type Scale = ScaleTime<number, number>

const ScaleContext = createContext<Scale>(scaleTime())

export interface ComponentProps {
	/** Minimum bound of time region to display. */
	min?: number
	/** Maximum bound of time region to display. */
	max?: number
}

export const Component = ({
	min = 0,
	max = 1000, // Infinity,
}: ComponentProps) => (
	<ScaleHandler min={min} max={max}>
		<div className={styles.container}>
			<Row>
				<Item value={741}>Test 1</Item>
			</Row>
			<Row>
				<Item value={1563}>Test 2</Item>
			</Row>
			<Item value={5341}>Test 3</Item>
		</div>
		<Axis/>
	</ScaleHandler>
)

interface ScaleHandlerProps {
	min: number
	max: number
}

function ScaleHandler({children, min, max}: PropsWithChildren<ScaleHandlerProps>) {
	// State of the current domain, selected via pan/zoom by the user
	const [userDomain, setUserDomain] = useState<[number, number]>([min, max])

	// Keep the scale up to date with the user's domain
	// TODO: Keep an eye on the perf here. I don't like regenning the scale every time, but it's
	//       the easiest way to cascade updates over the context. It... should be fine?
	const scale = useMemo(
		() => scaleTime().range([0, 100]).domain(userDomain),
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

const Row = ({children}: PropsWithChildren<{}>) => {
	return (
		<div className={styles.row}>
			{children}
		</div>
	)
}

interface ItemProps {
	// TODO: Need start/end value handling too tbh
	value: number
}

const Item = ({value, children}: PropsWithChildren<ItemProps>) => {
	const scale = useContext(ScaleContext)

	return (
		<div className={styles.item} style={{left: `${scale(value)}%`}}>
			{children}
		</div>
	)
}

const Axis = () => {
	const scale = useContext(ScaleContext)

	return (
		<div className={styles.axis}>
			{scale.ticks().map((tick, index) => (
				<div key={index} className={styles.tick} style={{left: `${scale(tick)}%`}}>
					{formatTick(tick)}
				</div>
			))}
		</div>
	)
}

const formatTick = (date: Date) => (
	timeSecond(date) < date ? utcFormat('.%L') :
	timeMinute(date) < date ? utcFormat('%-S') :
	utcFormat('%-Mm')
)(date)
