import cx from 'classnames'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import React, {CSSProperties, useState} from 'react'
import Measure from 'react-measure'
import {FixedSizeList} from 'react-window'
import {Pull} from 'report'
import {Icon, Modal, Popup} from 'semantic-ui-react'
import {formatDuration} from 'utilities/strings'
import {eventFormatters} from './eventFormatter'
import styles from './EventsView.module.css'

const rowHeight = parseInt(styles.rowHeight, 10)

export class EventsView extends Analyser {
	static title = 'Events View'
	static handle = 'eventsView'
	static displayOrder = -Infinity
	static debug = true

	private events: Event[] = []

	initialise() {
		this.debug(() => {
			// catch every event
			this.addEventHook({}, event => this.events.push(event))
		})
	}

	output() {
		const data = {
			events: this.events,
			pull: this.parser.pull,
		}

		return <EventsViewComponent data={data}/>
	}
}

interface EventsViewData {
	events: Event[]
	pull: Pull
}

interface EventsViewComponentProps {
	data: EventsViewData
}

function EventsViewComponent({data}: EventsViewComponentProps) {
	const [width, setWidth] = useState<number>()

	const height = 500
	// Bumped overscan to handle scrolling nicer for the large data set.
	const overscanCount = 10

	return <>
		<Measure
			bounds
			children={({measureRef}) => <div ref={measureRef}/>}
			onResize={contentRect => setWidth(contentRect.bounds?.width)}
		/>

		{width != null && (
			<FixedSizeList
				width={width}
				height={height}
				itemSize={rowHeight}
				itemCount={data.events.length}
				overscanCount={overscanCount}
				itemData={data}
				children={EventItem}
			/>
		)}
	</>
}

interface EventItemProps {
	data: EventsViewData
	index: number
	style: CSSProperties
}

function EventItem({data: {events, pull}, index, style}: EventItemProps) {
	const event = events[index]

	const timestamp = formatDuration(
		event.timestamp - pull.timestamp,
		{secondPrecision: 3},
	)

	const formatter = eventFormatters.get(event.type)
	const formatted = formatter != null
		? formatter({event, pull})
		: JSON.stringify(event)

	return (
		<div className={cx(styles.row, index % 2 === 1 && styles.odd)} style={style}>
			<div className={styles.timestamp}>{timestamp}</div>
			<div className={styles.type}>{event.type}</div>
			<div className={styles.description}>{formatted}</div>
			<div className={styles.showData}>
				<Popup
					trigger={<Icon name="code"/>}
					content={<pre>{JSON.stringify(event, undefined, 2)}</pre>}
					position="left center"
					on="click"
				/>
			</div>
		</div>
	)
}
