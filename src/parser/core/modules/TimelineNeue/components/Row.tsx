import classNames from 'classnames'
import React, {createContext, memo, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'
import ReactDOM from 'react-dom'
import Measure, {ContentRect} from 'react-measure'
import styles from './Timeline.module.css'

interface RowContextValue {
	collapse: boolean
	siblingSize: number
	reportSize: (id: number, size: number) => void
}

const RowContext = createContext<RowContextValue>({
	collapse: false,
	siblingSize: 0,
	reportSize: () => { throw new Error('No provider found') },
})

const ItemContainerContext = createContext<HTMLDivElement | null>(null)

export function ItemContainer({children}: {children?: ReactNode}) {
	const ref = useContext(ItemContainerContext)
	if (ref == null) { return null }
	return ReactDOM.createPortal(children, ref)
}

function useSizeCalculator() {
	const [sizes, setSizes] = useState<Record<number, number>>({})
	const reportSize = useCallback(
		(id: number, size: number) => {
			setSizes(value => ({
				...value,
				[id]: size,
			}))
		},
		[],
	)

	const maxSize = useMemo(
		() => Math.max(0, ...Object.values(sizes)),
		[sizes],
	)

	return [maxSize, reportSize] as const
}

/**
 * Root row handler, provides space beside the rest of the timeline for rows
 * to put their labels.
 */
export const LabelSpacer = memo(function LabelSpacer({children}) {
	const [maxChildSize, reportChildSize] = useSizeCalculator()

	const rowContextValue = useMemo(
		() => ({
			collapse: false,
			siblingSize: maxChildSize,
			reportSize: reportChildSize,
		}),
		[maxChildSize, reportChildSize],
	)

	return (
		<div style={{paddingLeft: maxChildSize}}>
			<RowContext.Provider value={rowContextValue}>
				{children}
			</RowContext.Provider>
		</div>
	)
})

export interface RowProps {
	children?: ReactNode,
	/** Label to display beside this row. */
	label?: ReactNode
}

export const Row = memo<RowProps>(function Row({children, label}) {
	const rowId = useUniqueId()

	const {collapse, siblingSize, reportSize} = useContext(RowContext)

	// Track own label size
	const [labelSize, setLabelSize] = useState(0)

	// Track the maximum size of child labels
	const [maxChildSize, reportChildSize] = useSizeCalculator()

	// Report when the total size of this label changes
	useEffect(
		() => reportSize(rowId, maxChildSize + labelSize),
		[reportSize, maxChildSize, labelSize],
	)

	// A label is "collapsed" if it has active children
	// Active children take up space, so assume maxChildSize is representative
	const labelCollapsed = maxChildSize > 0

	// Clicking a label toggles collapsing its children
	const [collapseChildren, setCollapseChildren] = useState(false)
	const onClick = useCallback(
		() => setCollapseChildren(value => !value),
		[],
	)

	const [itemsRef, setItemsRef] = useState<HTMLDivElement | null>(null)

	const rowContextValue = {
		collapse: collapse || collapseChildren,
		siblingSize: siblingSize - labelSize,
		reportSize: reportChildSize,
	}

	return (
		<div className={collapse ? undefined : styles.row}>
			{label != null && !collapse && (
				<Label
					collapsed={labelCollapsed}
					offset={siblingSize}
					reportSize={setLabelSize}
					onClick={onClick}
				>
					{label}
				</Label>
			)}

			<div ref={setItemsRef} className={styles.itemContainer}/>

			<RowContext.Provider value={rowContextValue}>
				<ItemContainerContext.Provider value={itemsRef}>
					{children}
				</ItemContainerContext.Provider>
			</RowContext.Provider>
		</div>
	)
})

interface LabelProps {
	children?: ReactNode
	collapsed: boolean
	offset: number
	reportSize: (size: number) => void
	onClick: () => void
}

const Label = memo<LabelProps>(function Label({
	children,
	collapsed,
	offset,
	reportSize,
	onClick,
}) {
	// TODO: Maybe a ref?
	const [availableHeight, setAvailableHeight] = useState(0)
	const [size, setSize] = useState({width: 0, height: 0})

	// Tracking background height so we can overflow the collapsed view
	const onResizeBackground = ({client}: ContentRect) => {
		setAvailableHeight(client?.height ?? 0)
	}

	// Track content size
	const onResizeContent = ({client}: ContentRect) => {
		if (client == null) { return }
		setSize(client)
	}

	// When the content size changes, or is collapsed, report the new size to parent
	useEffect(
		() => reportSize(collapsed ? size.height : size.width),
		[collapsed, size],
	)

	// Using effect just for it's destructor, will trigger a report of 0 on unmount.
	useEffect(() => () => {
		reportSize(0)
	}, [])

	return <>
		<Measure client onResize={onResizeBackground}>
			{({measureRef}) => (
				<div
					ref={measureRef}
					onClick={onClick}
					className={classNames(
						styles.labelBackground,
						collapsed && styles.collapsed,
					)}
					style={{left: -offset, width: offset}}
				/>
			)}
		</Measure>
		<Measure client onResize={onResizeContent}>
			{({measureRef}) => (
				<div
					ref={measureRef}
					onClick={onClick}
					className={classNames(
						styles.labelContent,
						collapsed && styles.collapsed,
					)}
					style={{
						left: -offset,
						maxWidth: collapsed ? availableHeight : undefined,
					}}
				>
					{children}
				</div>
			)}
		</Measure>
	</>
})

let nextId = 0
const useUniqueId = () => useRef(nextId++).current
