import React from 'react'
import {formatDuration} from 'utilities'
import {Row as RowConfig} from '../config'
import {Axis} from './Axis'
import {Row} from './Row'
import {HoverState, ScaleHandler, ScaleHandlerProps} from './ScaleHandler'
import styles from './Timeline.module.css'
import {getMaxChildren, getMaxDepth} from './utilities'

export type TimelineProps =
	& Omit<ScaleHandlerProps, 'children'>
	& {row: RowConfig}

export function Timeline({
	row,
	...scaleHandlerProps
}: TimelineProps) {
	const maxDepth = getMaxDepth(row.rows)
	const maxChildren = getMaxChildren(row)

	return (
		<ScaleHandler {...scaleHandlerProps}>
			{({measureRef, hover}) => (
				<div className={styles.timeline}>
					<div
						ref={measureRef}
						className={styles.tooltipContainer}
						style={{
							gridColumnStart: 2,
							gridColumnEnd: 'span 1',
							gridRowStart: 1,
							gridRowEnd: `span ${maxChildren + 1}`,
						}}
					>
						{hover != null && (
							<Tooltip hover={hover} row={row}/>
						)}
					</div>

					<Axis height={maxChildren}/>

					<Row
						row={row}
						depth={-1}
						maxDepth={maxDepth}
						top={1}
						height={maxChildren}
						parentCollapsed={false}
					/>
				</div>
			)}
		</ScaleHandler>
	)
}

interface TooltipProps {
	hover: HoverState
	row: RowConfig
}

function Tooltip({
	hover,
	row,
}: TooltipProps) {
	return <>
		<div
			className={styles.tooltipMarker}
			style={{transform: `translateX(${hover.left}px)`}}
		/>

		<div
			className={styles.tooltipDetails}
			style={{transform: `translate(${hover.left}px, ${hover.top}px)`}}
		>
			<strong>
				{formatDuration(hover.timestamp, {
					secondPrecision: 3,
					hideMinutesIfZero: false,
				})}
			</strong>

			{row.TooltipContent && <row.TooltipContent timestamp={hover.timestamp}/>}
		</div>
	</>
}
