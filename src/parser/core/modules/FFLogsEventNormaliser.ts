import {Event} from 'fflogs'
import Module from 'parser/core/Module'

const CALCULATED_EVENTS: Array<Event['type']> = [
	'calculateddamage',
	'calculatedheal',
]

const BASELINE_EVENTS: Array<Event['type']> = [
	'damage',
	'heal',
]

export class FFLogsEventNormaliser extends Module {
	static handle: string = 'fflogsEvents'

	private _hasCalculatedEvents: boolean = false

	get hasCalculatedEvents() {
		return this._hasCalculatedEvents
	}

	get damageEventName() {
		return (this._hasCalculatedEvents ? 'calculateddamage': 'damage')
	}

	get healEventName() {
		return (this._hasCalculatedEvents ? 'calculatedheal': 'heal')
	}

	normalise(events: Event[]): Event[] {
		for (const event of events) {
			// Check to see if this is a calculated damage/heal event and set the _hasCalculated events flag if it is
			// Once we've seen one, return
			if (CALCULATED_EVENTS.includes(event.type)) {
				this._hasCalculatedEvents = true
				return events
			}
		}

		return events
	}
}
