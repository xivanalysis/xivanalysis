import React from 'react'
import {Row as RowConfig} from '../config'
import {Rows} from './Row'
import {ScaleHandler, ScaleHandlerProps} from './ScaleHandler'
import styles from './Timeline.module.css'

export type TimelineProps =
	& ScaleHandlerProps
	& {rows?: RowConfig[]}

export function Timeline({
	rows = [],
	...scaleHandlerProps
}: TimelineProps) {
	const maxDepth = getMaxDepth(rows)

	return (
		<ScaleHandler {...scaleHandlerProps}>
			{({measureRef}) => (
				<div className={styles.timeline}>
					<div ref={measureRef} style={{gridColumnStart: 2, gridColumnEnd: 'span 1'}}/>

					<Rows
						rows={rows}
						depth={0}
						maxDepth={maxDepth}
						top={1}
						parentCollapsed={false}
					/>
				</div>
			)}
		</ScaleHandler>
	)
}

const getMaxDepth = (rows: RowConfig[]): number =>
	rows.reduce((acc, cur) => Math.max(acc, getMaxDepth(cur.rows) + 1), 0)
