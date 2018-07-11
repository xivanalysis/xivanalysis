import Module from 'parser/core/Module'

// Blame Meishu. No touchy.
const INTERNAL_EVENT_TYPE = Symbol('aoe')

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
		const sources = {}
		function getSource(event) {
			const id = event.sourceID
			return sources[id] = sources[id] || {
				castEvent: null,
				damageEvents: [],
				insertAfter: 0,
			}
		}

		function addEvent(source) {
			events.splice(source.insertAfter + 1, 0, {
				...source,
				type: INTERNAL_EVENT_TYPE,
			})
		}

		for (let i = 0; i < events.length; i++) {
			const event = events[i]
			const source = getSource(event)

			// eslint-disable-next-line default-case
			switch (event.type) {
			case 'cast':
				// If there's at least one hit, add the event in
				if (source.damageEvents.length) {
					addEvent(source)
					i++
				}

				// start recording the hit
				source.castEvent = event
				source.damageEvents = []
				break

			case 'damage':
				// Ignore ticks, they're a whole other ball game
				if (event.tick) { continue }

				// If there's no cast for whatever reason, generate one
				if (!source.castEvent) {
					source.castEvent = {...event, type: 'cast'}
				}

				// If the cast doesn't match the damage, something weird's happened but handle it
				// TODO: Should I also check for damage events a given time away from one another?
				if (source.castEvent.ability.guid !== event.ability.guid) {
					addEvent(source)
					i++
					source.castEvent = {...event, type: 'cast'}
					source.damageEvents = []
				}

				// Record a damage hit and the insert pos (adding event after the last damage)
				source.damageEvents.push(event)
				source.insertAfter = i
			}
		}

		return events
	}

	_onAoe(event) {
		// Filter out any damage events that don't pass muster, and transform into a simplified format
		const hits = event.damageEvents
			.filter(this.isValidHit.bind(this))
			.map(event => ({id: event.targetID, instance: event.targetInstance}))

		this.parser.fabricateEvent({
			type: 'aoedamage',
			castEvent: event.castEvent,
			ability: event.castEvent.ability,
			hits,
			sourceID: event.castEvent.sourceID,
		})
	}

	isValidHit(/* event */) {
		// Doesn't look like it's possible to derive invalid targets from fflog's api
		// Leaving that to boss modules instead
		return true
	}
}
