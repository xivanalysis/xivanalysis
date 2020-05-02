import Module from 'parser/core/Module'

const CAST_EVENT_TYPES = [
	'begincast',
	'cast',
]

const DAMAGE_EVENT_TYPES = [
	'damage',
	'calculateddamage',
]

// Actions that initiate a pull are only a damage event - no cast
// Fabricate fake cast events to clean up the mess
export default class PrecastAction extends Module {
	static handle = 'precastAction'

	normalise(events) {
		const startTime = this.parser.fight.start_time

		for (let i = 0; i < events.length; i++) {
			const event = events[i]

			// Only care about events by the player
			if (!this.parser.byPlayer(event) || !event.ability) { continue }

			// If they cast, this log doesn't need fixing (or we've fixed it)
			if (CAST_EVENT_TYPES.includes(event.type)) { break }

			// If we've got to here and it's a damage event, we need to fab cast events
			if (!DAMAGE_EVENT_TYPES.includes(event.type)) { continue }

			// TODO: Is it worth fabricating a begincast?
			events.splice(0, 0, {
				...event,
				timestamp: startTime,
				type: 'cast',
			})
			break
		}

		return events
	}
}
