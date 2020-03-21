import React, {memo, PropsWithChildren, useRef} from 'react'
import Measure, {ContentRect} from 'react-measure'
import {ItemContainer} from './Row'
import {Scalable, useScale} from './ScaleHandler'
import styles from './Timeline.module.css'

export interface ItemProps {
	/** Start point of the action. Defines the left-most bound. */
	start: Scalable

	/**
	 * End point of the action. Defines the right-most bound. If unspecified, the item will expand
	 * to fit its contnent.
	 */
	end?: Scalable

	/**
	 * If true, the Item will not be culled when outside the visible range of the parent scale.
	 * This has performance implications. Do not disable unless you are handling culling yourself.
	 */
	disableCulling?: boolean,
}

export const Item = memo<PropsWithChildren<ItemProps>>(function Item(props) {
	const scale = useScale()
	const [min, max] = scale.range()

	// Should this be a ref or state?
	const width = useRef<number>()

	const left = scale(props.start)
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
