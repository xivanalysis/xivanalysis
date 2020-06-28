import {Event} from 'events'
import {CastEvent, isCastEvent, isDamageEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import {Data} from 'parser/core/modules/Data'

// Actions that initiate a pull are only a damage event - no cast
// Fabricate fake cast events to clean up the mess
export default class PrecastAction extends Module {
	static handle = 'precastAction'
	static debug = false

	@dependency private data!: Data

	normalise(events: Event[]): Event[] {
		const startTime = this.parser.eventTimeOffset

		for (const event of events) {
			this.debug(`Timestamp: ${event.timestamp} - Event Type: ${String(event.type)} - Action: ${(event.ability != null) ? event.ability.name : ''}`)

			// Only care about ability events by the player
			if (!this.parser.byPlayer(event) || event.ability == null) {
				continue
			}

			// Check if action is an autoattack, ignore if it is
			if (this.data.getAction(event.ability.guid)?.autoAttack) {
				continue
			}

			// Once we hit a non-auto cast event, there are no other pre-cast actions to synthesize, bail out
			if (isCastEvent(event)) {
				break
			}

			// If this is a damage event, fabricate a cast event for it and end
			if (isDamageEvent(event)) {
				this.debug('Synthesizing cast event for damage event')
				const synthesizedEvent: CastEvent = {...event, type: 'cast', timestamp: startTime}
				events.splice(0, 0, synthesizedEvent)
				break
			}
		}

		return events
	}
}
