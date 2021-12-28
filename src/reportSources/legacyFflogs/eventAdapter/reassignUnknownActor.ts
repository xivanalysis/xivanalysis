import {Event} from 'event'
import {Actor} from 'report'
import {resolveActorId} from '../base'
import {FflogsEvent} from '../eventTypes'
import {AdapterStep, MutationAdaptionResult} from './base'

/**
 * FFLogs doesn't seem to guarantee that every actor in events is present in
 * the report the events are for. We're patching around this by checking the
 * source and target of the events, and patching them to -1 if we don't see it
 * in the report. -1 mapped in the translate step to a special sentinel actor.
 *
 * Realistically, this will primarily be caused by inlined actors. We don't
 * currently account for these - not really worth it, as they'll never be
 * primary targets or players.
 */
export class ReassignUnknownActorStep extends AdapterStep {
	// Optimisation; store results of ID lookups to save looping the actors array every time
	private knownIds = new Map<Actor['id'], boolean>()

	override adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]): MutationAdaptionResult {
		// In the common case, this chain of assignments isn't actually changing anything -
		// we're only creating a new event object when an explicit mutation is performed.
		let event = baseEvent
		event = this.reassign(event, 'source')
		event = this.reassign(event, 'target')

		return {
			adaptedEvents,
			dangerouslyMutatedBaseEvent: event,
		}
	}

	private reassign<F extends 'source' | 'target'>(event: FflogsEvent, field: F) {
		const idField = `${field}ID` as const
		const instanceField = `${field}Instance` as const

		const actorId = resolveActorId({
			id: event[idField],
			instance: event[instanceField],
			actor: event[field],
		})

		let exists = this.knownIds.get(actorId)
		if (exists == null) {
			exists = this.pull.actors.some(actor => actor.id === actorId)
			this.knownIds.set(actorId, exists)
		}
		if (exists) { return event }

		// Build a mutated event
		const mutatedEvent = {...event}
		mutatedEvent[idField] = -1
		delete mutatedEvent[instanceField]
		delete mutatedEvent[field]

		return mutatedEvent
	}
}
