import {Fflogs} from '@xivanalysis/parser-reader-fflogs'

// XIV seems to use a lot of copies of the boss to handle certain mechanics... which wouldn't be an issue if it wasn't for debuffs being mirrored to them to generate tonnes of crap events.

// Events we'll use to signal a target is active
const TARGET_CHECK_EVENT_TYPES = new Set(['damage', 'heal'])

export function findActiveTargets(events: Fflogs.Event[], combatantId: number) {
	const targets = new Map<number, Set<number>>()

	for (const event of events) {
		// We only care about events by the player, directly onto another actor
		if (
			!TARGET_CHECK_EVENT_TYPES.has(event.type) ||
			event.sourceID !== combatantId ||
			!event.targetID
		) {
			continue
		}

		let instances = targets.get(event.targetID)
		if (!instances) {
			instances = new Set()
			targets.set(event.targetID, instances)
		}

		if (event.targetInstance) {
			instances.add(event.targetInstance)
		}
	}

	return targets
}
