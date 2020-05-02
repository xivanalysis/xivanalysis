import {Event, isAbilityEvent, isCastEvent, isDamageEvent} from 'fflogs'
import Module from 'parser/core/Module'

// Actions that initiate a pull are only a damage event - no cast
// Fabricate fake cast events to clean up the mess
export default class PrecastAction extends Module {
	static handle = 'precastAction'
	static debug = false

	normalise(events: Event[]): Event[] {
		const startTime = this.parser.fight.start_time

		for (const event of events) {
			this.debug(`Timestamp: ${event.timestamp} - Event Type: ${String(event.type)} - Action: ${isAbilityEvent(event) ? event.ability.name : ''}`)

			// Only care about events by the player and ignore autoattacks
			if (!this.parser.byPlayer(event) || !isAbilityEvent(event) || event.ability.name === 'attack')
				continue

			// Once we hit a non-auto cast event, there are no other pre-cast actions to synthesize, bail out
			if (isCastEvent(event))
				break

			// If this is a damage event, fabricate a cast event for it and end
			if (isDamageEvent(event)) {
				this.debug('Synthesizing cast event for damage event')
				events.splice(0, 0, {
					...event,
					timestamp: startTime,
					type: 'cast',
				})
				break
			}
		}

		return events
	}
}
