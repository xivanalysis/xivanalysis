import React from 'react'
import {Item as ItemConfig, Row as RowConfig} from '../config'
import {Axis} from './Axis'
import {Items} from './Item'
import {Rows} from './Row'
import {ScaleHandler, ScaleHandlerProps} from './ScaleHandler'
import styles from './Timeline.module.css'
import {getMaxChildren, getMaxDepth} from './utilities'

export type TimelineProps =
	& ScaleHandlerProps
	& {rows?: RowConfig[], items?: ItemConfig[]}

export function Timeline({
	rows = [],
	items = [],
	...scaleHandlerProps
}: TimelineProps) {
	const maxDepth = getMaxDepth(rows)
	const maxChildren = getMaxChildren({rows, items})

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
						height={maxChildren}
						parentCollapsed={false}
					/>

					{/* Root-level item track */}
					{items.length > 0 && (
						<div
							className={styles.track}
							style={{
								gridRowStart: 1,
								gridRowEnd: `span ${maxChildren}`,
							}}
						>
							<Items items={items}/>
						</div>
					)}
				</div>
			)}
		</ScaleHandler>
	)
}
