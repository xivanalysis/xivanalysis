import classNames from 'classnames'
import React, {memo, useCallback, useMemo, useState} from 'react'
import {Row as RowConfig} from '../config'
import styles from './Timeline.module.css'

// We're using an explicit grid for the primary timeline area, and a negative implicit grid
// for labels. CSS grids count negatives _starting_ at -1 at the end of the _explicit_ grid.
// This is the offset we need to "ignore" the explicit grid when setting implicit locations.
const LABEL_GRID_OFFSET = -2

interface SharedRowProps {
	depth: number,
	maxDepth: number,
	top: number,
	parentCollapsed: boolean,
}

export type RowsProps = SharedRowProps & {
	rows: RowConfig[],
}

export const Rows = memo(function Rows({
	rows,
	top,
	parentCollapsed,
	...rowProps
}: RowsProps) {
	const orderedRows = useMemo(
		() => rows.slice().sort((a, b) => (a. order ?? 0) - (b.order ?? 0)),
		[rows],
	)

	// Calculate sizes
	let currentTop = top
	const sizes = orderedRows.map((row) => {
		if (parentCollapsed) {
			return {
				top: currentTop,
				height: rows.length,
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
	height: number,
}

const Row = memo(function Row({
	row,
	depth,
	maxDepth,
	top,
	height,
	parentCollapsed,
}: RowProps) {
	const hasChildren = row.rows.length > 0

	// TODO hydrate from row once that has default collapsed state
	const [selfCollapsed, setSelfCollapsed] = useState(false)
	const toggleCollapsed = useCallback(
		() => setSelfCollapsed(value => !value),
		[],
	)

	// TODO: consider single child case
	const collapsible = hasChildren || undefined
	const collapsed = selfCollapsed || parentCollapsed

	const rowStyles = {
		gridRowStart: top,
		gridRowEnd: `span ${height}`,
		minHeight: parentCollapsed ? undefined : row.height,
	}

	const columnSpan = hasChildren && !selfCollapsed
		? 1
		: maxDepth - depth

	return <>
		{/* Label */}
		{parentCollapsed || <div
			className={classNames(
				styles.label,
				hasChildren && styles.hasChildren,
				collapsed && styles.collapsed,
			)}
			style={{
				gridColumnStart: (LABEL_GRID_OFFSET-maxDepth) + depth,
				gridColumnEnd: `span ${columnSpan}`,
				...rowStyles,
			}}
			onClick={collapsible && toggleCollapsed}
		>
			{row.label}
		</div>}

		{/* Row */}
		<div className={styles.track} style={rowStyles}>
			aaa
		</div>

		{hasChildren && <Rows
			rows={row.rows}
			depth={depth + 1}
			maxDepth={maxDepth}
			top={top}
			parentCollapsed={collapsed}
		/>}
	</>
})

const getMaxChildren = (row: RowConfig): number =>
	Math.max(1, row.rows.reduce((acc, cur) => acc + getMaxChildren(cur), 0))
