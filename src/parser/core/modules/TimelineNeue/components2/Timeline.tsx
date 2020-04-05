import React from 'react'
import {Row as RowConfig} from '../config'
import {Rows} from './Row'
import styles from './Timeline.module.css'

export interface TimelineProps {
	rows?: RowConfig[]
}

export function Timeline({
	rows = [],
}: TimelineProps) {
	const maxDepth = getMaxDepth(rows)

	return (
		<div className={styles.timeline}>
			{/* Root row list */}
			<Rows
				rows={rows}
				depth={0}
				maxDepth={maxDepth}
				top={1}
				parentCollapsed={false}
			/>
		</div>
	)
}

const getMaxDepth = (rows: RowConfig[]): number =>
	rows.reduce((acc, cur) => Math.max(acc, getMaxDepth(cur.rows) + 1), 0)
