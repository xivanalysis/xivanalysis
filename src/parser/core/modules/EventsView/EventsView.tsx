import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import React, {CSSProperties, useState} from 'react'
import Measure from 'react-measure'
import {FixedSizeList} from 'react-window'
import {eventFormatters} from './eventFormatter'

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
		return <EventsViewComponent events={this.events}/>
	}
}

interface EventsViewComponentProps {
	events: Event[]
}

function EventsViewComponent({events}: EventsViewComponentProps) {
	const [width, setWidth] = useState<number>()

	return <>
		<Measure
			bounds
			children={({measureRef}) => <div ref={measureRef}/>}
			onResize={contentRect => setWidth(contentRect.bounds?.width)}
		/>

		{width != null && (
			<FixedSizeList
				width={width}
				height={500} // todo?
				itemSize={40}
				itemCount={events.length}
				itemData={events}
				children={EventItem}
			/>
		)}
	</>
}

interface EventItemProps {
	data: Event[]
	index: number
	style: CSSProperties
}

function EventItem({data: events, index, style}: EventItemProps) {
	const event = events[index]
	const formatter = eventFormatters.get(event.type)
	const formatted = formatter != null
		? formatter(event)
		: JSON.stringify(event)

	return (
		<pre style={style}>
			{formatted}
		</pre>
	)
}
