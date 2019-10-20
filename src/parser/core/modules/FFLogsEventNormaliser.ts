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

	private _hasCalculatedEvents?: boolean

	get hasCalculatedEvents() {
		if (this._hasCalculatedEvents == null) {
			throw new Error('Attempted to check presence of calculated events before normaliser execution.')
		}
		return this._hasCalculatedEvents
	}

	get damageEventName() {
		return (this.hasCalculatedEvents ? 'calculateddamage': 'damage')
	}

	get healEventName() {
		return (this.hasCalculatedEvents ? 'calculatedheal': 'heal')
	}

	normalise(events: Event[]): Event[] {
		this._hasCalculatedEvents = false

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
