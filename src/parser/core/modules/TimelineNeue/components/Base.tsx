import React, {memo, PropsWithChildren} from 'react'
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

	const left = scale(props.time ?? props.start)
	const right = props.end && scale(props.end)

	// If the item would be out of the current bounds, don't bother rendering it
	// TODO: handle left side culling for items with no definitive `right` value
	if (
		left > max ||
		(right && right < min)
	) {
		return null
	}

	const style = {
		left,
		...right && {width: right - left},
	}

	return (
		<div className={styles.item} style={style}>
			{props.children}
		</div>
	)
})
