import React from 'react'
import {Row as RowConfig} from '../config'
import {Axis} from './Axis'
import {Rows} from './Row'
import {ScaleHandler, ScaleHandlerProps} from './ScaleHandler'
import styles from './Timeline.module.css'
import {getMaxChildren, getMaxDepth} from './utilities'

export type TimelineProps =
	& ScaleHandlerProps
	& {rows?: RowConfig[]}

export function Timeline({
	rows = [],
	...scaleHandlerProps
}: TimelineProps) {
	const maxDepth = getMaxDepth(rows)
	const maxChildren = getMaxChildren({rows})

	return (
		<ScaleHandler {...scaleHandlerProps}>
			{({measureRef}) => (
				<div className={styles.timeline}>
					<div ref={measureRef} style={{gridColumnStart: 2, gridColumnEnd: 'span 1'}}/>

					<Axis height={maxChildren}/>

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
