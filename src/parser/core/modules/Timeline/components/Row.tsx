import classNames from 'classnames'
import React, {CSSProperties, memo, ReactNode, useCallback, useMemo, useState} from 'react'
import Measure from 'react-measure'
import {Row as RowConfig} from '../config'
import {Items} from './Item'
import styles from './Timeline.module.css'
import {getItemCount, getMaxChildren} from './utilities'

// We're using an explicit grid for the primary timeline area, and a negative implicit grid
// for labels. CSS grids count negatives _starting_ at -1 at the end of the _explicit_ grid.
// This is the offset we need to "ignore" the explicit grid when setting implicit locations.
const LABEL_GRID_OFFSET = -2

interface SharedRowProps {
	depth: number,
	maxDepth: number,
	top: number,
	height: number,
	parentCollapsed: boolean,
}

export type RowsProps = SharedRowProps & {
	rows: readonly RowConfig[],
}

export const Rows = memo(function Rows({
	rows,
	top,
	height,
	parentCollapsed,
	...rowProps
}: RowsProps) {
	const orderedRows = useMemo(
		() => rows
			.filter(row => getItemCount(row) > 0)
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
		[rows],
	)

	// Calculate sizes
	let currentTop = top
	const sizes = orderedRows.map((row) => {
		if (parentCollapsed) {
			return {
				top: currentTop,
				height,
			}
		} else {
			const maxChildren = getMaxChildren(row)
			const thisTop = currentTop
			currentTop += maxChildren
			return {
				top: thisTop,
				height: maxChildren,
			}
		}
	})

	return <>
		{orderedRows.map((row, index) => (
			<Row
				key={index}
				row={row}
				top={sizes[index].top}
				height={sizes[index].height}
				parentCollapsed={parentCollapsed}
				{...rowProps}
			/>
		))}
	</>
})

type RowProps = SharedRowProps & {
	row: RowConfig,
}

const Row = memo(function Row({
	row,
	depth,
	maxDepth,
	top,
	height,
	parentCollapsed,
}: RowProps) {
	const [selfCollapsed, setSelfCollapsed] = useState(row.collapse ?? false)
	const toggleCollapsed = useCallback(
		() => setSelfCollapsed(value => !value),
		[],
	)

	// If the parent is collapsed and this row hides when in such a parent, we can just noop
	if (row.hideCollapsed && parentCollapsed) {
		return null
	}

	const hasChildren = row.rows.length > 0

	const collapsed = hasChildren && (selfCollapsed || parentCollapsed)

	const rowStyles = {
		gridRowStart: top,
		gridRowEnd: `span ${height}`,
		minHeight: parentCollapsed ? undefined : row.height,
	}

	return <>
		{/* Label */}
		{!parentCollapsed && row.label != null && (
			<Label
				minimised={hasChildren && !selfCollapsed}
				collapsed={collapsed}
				onClick={hasChildren ? toggleCollapsed : undefined}
				gridStyle={{ // TODO: Memo?
					gridColumnStart: (LABEL_GRID_OFFSET-maxDepth) + depth,
					...rowStyles,
				}}
			>
				{row.label}
			</Label>
		)}

		{/* Item track */}
		{row.items.length > 0 && (
			<div className={styles.track} style={rowStyles}>
				<Items items={row.items}/>
			</div>
		)}

		{hasChildren && (
			<Rows
				rows={row.rows}
				depth={depth + 1}
				maxDepth={maxDepth}
				top={top}
				height={height}
				parentCollapsed={collapsed}
			/>
		)}
	</>
})

interface LabelProps {
	minimised: boolean
	collapsed: boolean
	onClick?: () => void
	gridStyle?: CSSProperties
	children?: ReactNode
}

const Label = memo(function Label({
	minimised,
	collapsed,
	onClick,
	gridStyle,
	children,
}: LabelProps) {
	return (
		<Measure bounds>
			{({measureRef, contentRect}) => (
				<div
					ref={measureRef}
					className={classNames(
						styles.label,
						minimised && styles.minimised,
						collapsed && styles.collapsed,
					)}
					style={gridStyle}
					onClick={onClick}
				>
					<div
						className={styles.content}
						style={{maxWidth: minimised ? contentRect.bounds?.height : undefined}}
					>
						{children}
					</div>
				</div>
			)}
		</Measure>
	)
})
