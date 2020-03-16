import React, {memo, PropsWithChildren, useRef} from 'react'
import Measure, {ContentRect} from 'react-measure'
import styles from './Component.module.css'
import {ItemContainer} from './Row'
import {Scalable, useScale} from './ScaleHandler'

export const Container = memo(function Container({children}) { return (
	<div className={styles.container}>
		{children}
	</div>
) })

export type ItemProps = ItemTimeProps & {
	/**
	 * If true, the Item will not be culled when outside the visible range of the parent scale.
	 * This has performance implications. Do not disable unless you are handling culling yourself.
	 */
	disableCulling?: boolean,
}

type ItemTimeProps =
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
	if (props.disableCulling !== true && (left > max || (cullRight && cullRight < min))) {
		return null
	}

	const style = {
		left,
		...explicitRight && {width: explicitRight - left},
	}

	if (props.disableCulling || explicitRight != null) {
		return (
			<ItemContainer>
				<div className={styles.item} style={style}>
					{props.children}
				</div>
			</ItemContainer>
		)
	}

	const onResize = ({bounds}: ContentRect) => {
		width.current = bounds?.width
	}

	return (
		<ItemContainer>
			<Measure bounds onResize={onResize}>
				{({measureRef}) => (
					<div ref={measureRef} className={styles.item} style={style}>
						{props.children}
					</div>
				)}
			</Measure>
		</ItemContainer>
	)
})
