import classnames from 'classnames'
import React from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import {FixedSizeList as List, ListChildComponentProps} from 'react-window'
import {EventMeta} from './EventView'
import styles from './EventView.module.css'

const VIEW_HEIGHT = 500
const ITEM_HEIGHT = 20

export interface Props {
	meta: EventMeta[]
}

export const EventViewComponent = React.memo(({meta}: Props) => (
	<div style={{height: VIEW_HEIGHT}}>
		<AutoSizer disableHeight>
			{({width}) => (
				<List
					width={width}
					height={VIEW_HEIGHT}
					itemSize={ITEM_HEIGHT}
					itemCount={meta.length}
					itemData={meta}
				>
					{Row}
				</List>
			)}
		</AutoSizer>
	</div>
))

const Row = React.memo(({index, data, style}: ListChildComponentProps) => {
	const meta = data[index] as EventMeta
	return (
		<div
			style={style}
			className={classnames(
				styles.row,
				index % 2 === 1 && styles.even,
			)}
		>
			{meta.timestamp} - {meta.description}
		</div>
	)
})
