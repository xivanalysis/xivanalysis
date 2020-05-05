import Module from 'parser/core/Module'
import {HitType as EventHitType} from 'fflogs'

const ACTION_EVENT_TYPES = [
	'damage',
	'heal',
	'calculateddamage',
	'calculatedheal',
]

const FAILED_HITS = [
	EventHitType.MISS,
	EventHitType.IMMUNE,
]

export default class HitType extends Module {
	static handle = 'hitType'

	normalise(events) {
		for (let i = 0; i < events.length; i++) {
			const event = events[i]

			// Prune to only damage and heals since nothing else can crit/direct hit
			if (!ACTION_EVENT_TYPES.includes(event.type)) { continue }

			event.criticalHit = event.hitType === EventHitType.CRITICAL
			event.directHit = event.multistrike === true
			event.successfulHit = !FAILED_HITS.includes(event.hitType)
		}

		return events
	}
}
