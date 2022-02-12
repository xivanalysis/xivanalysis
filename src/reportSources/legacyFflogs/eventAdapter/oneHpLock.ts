import {Event, Events} from 'event'
import {Actor, Team} from 'report'
import {AdapterStep} from './base'

/**
 * FFLogs seems to generate nonsensical actor resource updates on bosses that
 * "castlock" at 1 HP - It'll show it dropping down to 0 HP (which should be
 * impossible), then back up to 1, every few seconds.
 *
 * This breaks a number of promises the xiva event system makes, and doesn't
 * really make sense anyway. We fix it by tweaking HP updates from 0 to 1 if
 * they are immediately followed by an HP update to 1.
 *
 * This adapter effectively expects `DeduplicateActorUpdate` to be in the
 * adapter pipeline.
 */
export class OneHpLockAdapterStep extends AdapterStep {
	override postprocess(adaptedEvents: Event[]) {
		const zeroHp = new Map<Actor['id'], Events['actorUpdate']>()

		for (const event of adaptedEvents) {
			// Only care about foe actor updates with current hp value
			if (
				event.type !== 'actorUpdate'
				|| event.hp?.current == null
				|| this.pull.actors.find(actor => actor.id === event.actor)?.team !== Team.FOE
			) { continue }

			const currentHp = event.hp.current

			// If the actor has just hit 0 HP, track that event, we may need to adjust it
			if (currentHp === 0) {
				zeroHp.set(event.actor, event)
				continue
			}

			// Get the 0 HP event for the actor - if there are none, we can bail
			const zeroHpEvent = zeroHp.get(event.actor)
			if (zeroHpEvent == null) { continue }

			// Regardless of the current HP value, we remove the event from the map
			// to prevent it causing further adjustments
			zeroHp.delete(event.actor)

			// If the HP moved from 0 -> 1, it's almost certainly the issue described
			// above. Anything else is probably a raise, and we can ignore.
			if (currentHp !== 1) { continue }
			zeroHpEvent.hp = {...zeroHpEvent.hp, current: 1}
		}

		return adaptedEvents
	}
}
