import {Event, Events} from 'event'
import {Actor} from 'parser/core/modules/Actors'
import {Team} from 'report'
import {FflogsEvent} from '../eventTypes'
import {AdapterStep} from './base'

/**
 * FF Logs is doing some incorrect adjustments to HP resources that cause a 0 HP
 * report without an accompanying death. These are typically caused by 1-hit
 * mecahnics being survived due to either fight mechanics or tank invulnerabilities.
 *
 * To resolve, we're capping resource updates at 1 HP, and then adjusting those
 * back down to 0 HP if we see a death.
 */
export class ErroneousFriendDeathAdapterStep extends AdapterStep {
	private adjustedEvents = new Map<Actor['id'], Array<Events['actorUpdate']>>()
	private deadActors = new Set<Actor['id']>()

	override adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]) {
		for (const adaptedEvent of adaptedEvents) {
			if (adaptedEvent.type !== 'actorUpdate') { continue }
			this.processActorUpdate(baseEvent, adaptedEvent)
		}

		return adaptedEvents
	}

	private processActorUpdate(baseEvent: FflogsEvent, adaptedEvent: Events['actorUpdate']) {
		// We only care about friendly actors
		const actor = this.pull.actors.find(actor => actor.id === adaptedEvent.actor)
		if (actor?.team !== Team.FRIEND) { return }

		// If we see HP > 0, we can safely assume that changes we've made are sane,
		// and that the actor is alive.
		if (adaptedEvent.hp?.current !== 0) {
			this.adjustedEvents.delete(actor.id)
			this.deadActors.delete(actor.id)
			return
		}

		// If we see an actor death, the changes we've made were incorrect - backtrack
		// and undo the changes, and mark the actor dead so we don't adjust future ones.
		if (baseEvent.type === 'death') {
			const actorEvents = this.adjustedEvents.get(actor.id)
			actorEvents?.forEach(event => {
				if (event.hp?.current == null) { return }
				event.hp.current = 0
			})

			this.adjustedEvents.delete(actor.id)
			this.deadActors.add(actor.id)
			return
		}

		// If we know the actor is already dead, there's no need to do any adjustment
		if (this.deadActors.has(actor.id)) { return }

		// If we get to here, we're assuming for now that the actor isn't dead, and
		// adjusting their HP up to 1
		adaptedEvent.hp.current = 1

		// Record this adjusted event in case we need to backtrack
		let actorEvents = this.adjustedEvents.get(actor.id)
		if (actorEvents == null) {
			actorEvents = []
			this.adjustedEvents.set(actor.id, actorEvents)
		}

		actorEvents.push(adaptedEvent)
	}
}
