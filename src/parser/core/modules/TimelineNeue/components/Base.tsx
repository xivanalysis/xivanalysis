import React, {createContext, memo, PropsWithChildren, ReactNode, useCallback, useContext, useMemo, useRef, useState} from 'react'
import Measure, {ContentRect} from 'react-measure'
import styles from './Component.module.css'
import {Scalable, useScale} from './ScaleHandler'

export const Container = memo(function Container({children}) { return (
	<div className={styles.container}>
		{children}
	</div>
) })

interface LabelContextValue {
	width: number
	reportWidth: (id: object, width?: number) => void
}

const LabelContext = createContext<LabelContextValue>({
	width: 0,
	reportWidth: () => { throw new Error('Attempting to report width with no parent label context.') },
})

function useMaxWidthCalculator() {
	const [width, setWidth] = useState(0)

	// Map that will store all the current widths
	const widthStore = useRef(new Map<object, number>()).current

	const reportWidth = useCallback(
		(id: object, newWidth?: number) => {
			newWidth != null
				? widthStore.set(id, newWidth)
				: widthStore.delete(id)

			const maxWidth = Math.max(...widthStore.values())
			setWidth(maxWidth)
			return maxWidth
		},
		[],
	)

	return useMemo(() => ({width, reportWidth}), [width, reportWidth])
}

export const LabelSpacer = memo(function LabelSpacer(props) {
	const widthContext = useMaxWidthCalculator()

	return (
		<div style={{paddingLeft: widthContext.width}}>
			<LabelContext.Provider value={widthContext}>
				{props.children}
			</LabelContext.Provider>
		</div>
	)
})

export interface RowProps {
	label?: ReactNode
}

export const Row = memo<PropsWithChildren<RowProps>>(function Row(props) {
	const {width, reportWidth} = useContext(LabelContext)

	const [ownWidth, setOwnWidth] = useState(0)
	const widthContext = useMaxWidthCalculator()

	// We're using a... blank object... as a unique reference. Because that's Smort™.
	const rowId = useRef({}).current
	const onResize = ({bounds}: ContentRect) => {
		if (!bounds?.width) { return }
		setOwnWidth(bounds.width)
		reportWidth(rowId, bounds.width + widthContext.width)
	}

	// When the ref is nulled, report a lack of width so the context can wipe us
	// I'm not using a useEffect destructor here, as the label can be removed without unmounting
	const ref = (elem: HTMLDivElement | null) => {
		if (elem != null) { return }
		reportWidth(rowId, undefined)
	}

	const childContext = {
		width: width - ownWidth,
		reportWidth: (childId: object, childWidth?: number) => {
			const maxChildWidth = widthContext.reportWidth(childId, childWidth)
			reportWidth(rowId, ownWidth + maxChildWidth)
		},
	}

	return (
		<div className={styles.row}>
			{props.label && (
				<Measure innerRef={ref} bounds onResize={onResize}>
					{({measureRef}) => (
						<div ref={measureRef} className={styles.label} style={{left: -width}}>
							{props.label}
						</div>
					)}
				</Measure>
			)}
			<LabelContext.Provider value={childContext}>
				{props.children}
			</LabelContext.Provider>
		</div>
	)
})

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
			<div className={styles.item} style={style}>
				{props.children}
			</div>
		)
	}

	const onResize = ({bounds}: ContentRect) => {
		width.current = bounds?.width
	}

	return (
		<Measure bounds onResize={onResize}>
			{({measureRef}) => (
				<div ref={measureRef} className={styles.item} style={style}>
					{props.children}
				</div>
			)}
		</Measure>
	)
})
