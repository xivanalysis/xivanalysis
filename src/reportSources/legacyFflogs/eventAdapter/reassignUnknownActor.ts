import {Event} from 'event'
import {FflogsEvent} from 'fflogs'
import {Actor} from 'report'
import {AdapterStep, resolveActorId} from './base'

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

	adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]): Event[] {
		this.reassign(baseEvent, 'source')
		this.reassign(baseEvent, 'target')

		return adaptedEvents
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
		if (exists) { return }

		// Am I seriously mutating the fflogs events?
		// Yup. This is cursed code.
		event[idField] = -1
		delete event[instanceField]
		delete event[field]
	}
}
