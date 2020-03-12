import React, {forwardRef, memo, PropsWithChildren, useRef} from 'react'
import Measure, {ContentRect} from 'react-measure'
import styles from './Component.module.css'
import {Scalable, useScale} from './ScaleHandler'

export const Container = memo(function Container({children}) { return (
	<div className={styles.container}>
		{children}
	</div>
) })

// TODO: Row is only seperate from Container as I'm expecting Row will have a bunch of special handling for the key down the left.
// If that isn't the case, one of the two can be removed.
export const Row = memo(function Row({children}) { return (
	<div className={styles.row}>
		{children}
	</div>
) })

export type ItemProps =
	| {time: Scalable, start?: never, end?: never}
	| {time?: never, start: Scalable, end: Scalable}

export const Item = memo<PropsWithChildren<ItemProps>>(function Item(props) {
	const scale = useScale()
	const [min, max] = scale.range()

	// Should this be a ref or state?
	const width = useRef<number>()

	const left = scale(props.time ?? props.start)
	const explicitRight = props.end && scale(props.end)

	// If the item would be out of the current bounds, don't bother rendering it
	const cullRight = explicitRight ?? (width.current && left + width.current)
	if (left > max || (cullRight && cullRight < min)) {
		return null
	}

	const style = {
		left,
		...explicitRight && {width: explicitRight - left},
	}

	const Content = forwardRef<HTMLDivElement>((_p, ref) => (
		<div ref={ref} className={styles.item} style={style}>
			{props.children}
		</div>
	))

	if (explicitRight != null) {
		return <Content/>
	}

	const onResize = ({bounds}: ContentRect) => {
		width.current = bounds?.width
	}

	return (
		<Measure bounds onResize={onResize}>
			{({measureRef}) => <Content ref={measureRef}/>}
		</Measure>
	)
})
