import {Events} from '@xivanalysis/parser-core'
import React from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import {FixedSizeList as List, ListChildComponentProps} from 'react-window'
import styles from './EventView.module.css'

const VIEW_HEIGHT = 500
const ITEM_HEIGHT = 20

export interface Props {
	events: Events.Base[]
}

export const EventViewComponent = React.memo(({events}: Props) => (
	<div style={{height: VIEW_HEIGHT}}>
		<AutoSizer disableHeight>
			{({width}) => (
				<List
					width={width}
					height={VIEW_HEIGHT}
					itemSize={ITEM_HEIGHT}
					itemCount={events.length}
					itemData={events}
				>
					{Row}
				</List>
			)}
		</AutoSizer>
	</div>
))

const Row = ({index, data, style}: ListChildComponentProps) => (
	<div style={style} className={styles.row}>
		{JSON.stringify(data[index])}
	</div>
)
