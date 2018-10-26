import Module from 'parser/core/Module'

const ACTION_EVENT_TYPES = [
	'damage',
	'heal',
]

export default class HitType extends Module {
	static handle = 'hitType'

	normalise(events) {
		for (let i = 0; i < events.length; i++) {
			const event = events[i]

			// Prune to only damage and heals since nothing else can crit/direct hit
			if (!ACTION_EVENT_TYPES.includes(event.type)) { continue }

			event.criticalHit = event.hitType === 2
			event.directHit = event.multistrike === true
		}

		return events
	}
}
