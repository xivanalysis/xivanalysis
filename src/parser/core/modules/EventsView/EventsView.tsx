import cx from 'classnames'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import React, {CSSProperties, useState} from 'react'
import Measure from 'react-measure'
import {FixedSizeList} from 'react-window'
import {Pull} from 'report'
import {Icon, Popup} from 'semantic-ui-react'
import {formatDuration} from 'utilities/strings'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {eventFormatters} from './eventFormatter'
import styles from './EventsView.module.css'

const rowHeight = parseInt(styles.rowHeight, 10)

export class EventsView extends Analyser {
	static override title = 'Events View'
	static override handle = 'eventsView'
	static override displayOrder = DISPLAY_ORDER.EVENTS_VIEW
	static override debug = true

	private events: Event[] = []

	override initialise() {
		this.debug(() => {
			// Catch every event. Note: if you're reading this - don't use the predicate for logic unless you know exactly what you're doing.
			// It's a massive anti-pattern, and I'm only doing it here as a microoptimisation for a single use case. If you're not sure, ask.
			this.addEventHook((event): event is never => {
				this.events.push(event)
				return false
			}, () => { /* noop - this will never be called */ })
		})
	}

	override output() {
		if (this.events.length === 0) {
			return null
		}

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
		{secondPrecision: 3, showNegative: true},
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
