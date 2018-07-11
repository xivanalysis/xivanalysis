import Module from 'parser/core/Module'

// Blame Meishu. No touchy.
const INTERNAL_EVENT_TYPE = Symbol('aoe')

// Sequential damage events with more than this time diff (in ms) will be considered seperate damage pulses
const NEW_AOE_THRESHOLD = 20

export default class AoE extends Module {
	static handle = 'aoe'

	constructor(...args) {
		super(...args)
		// Listen to our own event from normalisation
		this.addHook(INTERNAL_EVENT_TYPE, this._onAoe)
	}

	// Need to normalise so the final events can go out at the right time
	normalise(events) {
		// Track hits by source
		const trackers = {}
		function getTracker(event) {
			if (!event.ability) {
				return {}
			}

			if (!trackers[event.sourceID]) {
				trackers[event.sourceID] = {}
			}

			const source = trackers[event.sourceID]
			const abilityId = event.ability.guid
			return source[abilityId] = source[abilityId] || {
				damageEvents: [],
				insertAfter: 0,
			}
		}

		const toAdd = []
		function addEvent(tracker) {
			toAdd.push({
				...tracker,
				type: INTERNAL_EVENT_TYPE,
				timestamp: tracker.damageEvents[0].timestamp,
			})
		}

		for (let i = 0; i < events.length; i++) {
			const event = events[i]

			if (event.type !== 'damage') {
				continue
			}

			const tracker = getTracker(event)

			// If the last damage event was too long ago, generate an event
			const lastDamage = tracker.damageEvents[tracker.damageEvents.length - 1]
			if (lastDamage && event.timestamp - lastDamage.timestamp > NEW_AOE_THRESHOLD) {
				addEvent(tracker)
				tracker.damageEvents = []
			}

			event.i = i
			tracker.damageEvents.push(event)
			tracker.insertAfter = i
		}

		// Run a cleanup
		for (const sourceId in trackers) {
			for (const abilityId in trackers[sourceId]) {
				const tracker = trackers[sourceId][abilityId]
				if (tracker.damageEvents.length === 0) { continue }
				addEvent(tracker)
			}
		}

		// Add all the events we gathered up in, in order
		let offset = 0
		toAdd.sort((a, b) => a.insertAfter - b.insertAfter).forEach(event => {
			events.splice(event.insertAfter + 1 + offset, 0, event)
			offset++
		})

		return events
	}

	_onAoe(event) {
		// Filter out any damage events that don't pass muster, and transform into a simplified format
		const hits = event.damageEvents
			.filter(this.isValidHit.bind(this))
			.map(event => ({id: event.targetID, instance: event.targetInstance}))

		this.parser.fabricateEvent({
			type: 'aoedamage',
			ability: event.damageEvents[0].ability,
			hits,
			sourceID: event.damageEvents[0].sourceID,
		})
	}

	isValidHit(/* event */) {
		// Doesn't look like it's possible to derive invalid targets from fflog's api
		// Leaving that to boss modules instead
		return true
	}
}
