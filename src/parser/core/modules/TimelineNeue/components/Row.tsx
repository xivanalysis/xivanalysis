import classNames from 'classnames'
import React, {createContext, memo, PropsWithChildren, ReactNode, useCallback, useContext, useMemo, useRef, useState} from 'react'
import Measure, {ContentRect} from 'react-measure'
import styles from './Component.module.css'

interface LabelContextValue {
	/** Current available width for labels. */
	width: number
	/** Call to report own width, used to choose the final available width. */
	reportWidth: (id: object, width?: number) => void
	/** When true, the row should be in a collapsed state, deferring to parent for layout. */
	collapsed?: boolean
}

const LabelContext = createContext<LabelContextValue>({
	width: 0,
	reportWidth: () => { throw new Error('Attempting to report width with no parent label context.') },
	collapsed: false,
})
/**
 * Reuseable width calculator. Returned label context will represent the
 * widest reported width.
 */
function useMaxWidthCalculator() {
	const [width, setWidth] = useState(0)

	// Map that will store all the current widths
	const widthStore = useRef(new Map<object, number>()).current

	// Calculate + return the new max width on each report. A report of undefined
	// signals the element is being removed, and should no longer be considered.
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

/**
 * Root row handler, provides space beside the rest of the timeline for rows
 * to put their labels.
 */
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
	/** Label to display beside this row. */
	label?: ReactNode
}

export const Row = memo<PropsWithChildren<RowProps>>(function Row(props) {
	// Set up width values for the parent, self, and children
	const {
		width: parentWidth,
		reportWidth: parentReportWidth,
		collapsed: parentCollapsed,
	} = useContext(LabelContext)
	const [ownWidth, setOwnWidth] = useState(0)
	const childWidthContext = useMaxWidthCalculator()

	// Track explicit collapsed status & read in the parent's state
	// TODO: Figure out how this will interact with props, if any
	const [collapsed, setCollapsed] = useState(false)

	// We're using a... blank object... as a unique reference. Because that's Smort™.
	const rowId = useRef({}).current

	// When _we_ resize, track our width, and report it along side the max child width
	const onResize = ({bounds}: ContentRect) => {
		if (!bounds?.width) { return }
		setOwnWidth(bounds.width)
		parentReportWidth(rowId, bounds.width + childWidthContext.width)
	}

	// When the ref is nulled, report a lack of width so the context can wipe us
	// I'm not using a useEffect destructor here, as the label can be removed without unmounting
	const ref = (elem: HTMLDivElement | null) => {
		if (elem != null) { return }
		parentReportWidth(rowId, undefined)
	}

	// "Proxy" over the parent context, adjusting the values to nest the children
	const childContext = {
		width: parentWidth - ownWidth,
		reportWidth: (childId: object, childWidth?: number) => {
			const maxChildWidth = childWidthContext.reportWidth(childId, childWidth)
			parentReportWidth(rowId, ownWidth + maxChildWidth)
		},
		collapsed: collapsed || parentCollapsed,
	}

	const hasChildLabels = childWidthContext.width > 0

	const onLabelClick = useCallback(() => setCollapsed(collapsed => !collapsed), [])

	return (
		<div className={parentCollapsed ? undefined : styles.row}>
			{props.label && !parentCollapsed && (
				<Measure innerRef={ref} bounds onResize={onResize}>
					{({measureRef}) => (
						<div
							ref={measureRef}
							onClick={onLabelClick}
							className={classNames(
								styles.label,
								hasChildLabels && styles.collapsed,
							)}
							style={{left: -parentWidth}}
						>
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
