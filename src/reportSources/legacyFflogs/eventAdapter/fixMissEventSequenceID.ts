import {Event, Events} from 'event'
import {AdapterStep} from './base'
import {FflogsEvent} from '../eventTypes'

/**
 * FFLogs models damage events that hit multiple targets as separate events with the same SequenceID and timestamp.
 * However, if one event fails to hit (miss or an invuln target), then the sequence ID will be omitted from the failed hit.
 * We need to readd the omitted SequenceID so that AOE deduplication will work correctly
 * NOTE: this adapter step MUST run after TranslateStep or it will not have any effect.  Running after translation to simplify event interface that we need to look at and modify.
 */
export class FixMissEventSequenceIDStep extends AdapterStep {
	private lastTimestamp = -1
	private sequenceless = new Map<string, Array<Events['damage']>>()
	private sequences = new Map<string, number>()

	override adapt(_baseEvent: FflogsEvent, adaptedEvents: Event[]): Event[] {
		return adaptedEvents.map(event => this.adaptEvent(event))
	}

	private adaptEvent(event: Event): Event {
		// We only care about damage events caused by an action
		if (event.type !== 'damage') {
			return event
		}

		const cause = event.cause
		if (cause.type !== 'action') {
			return event
		}

		// If the timestamp has changed, any remaining sequenceless events can be
		// backfilled with a faux sequence value, and state can be cleared.
		if (event.timestamp !== this.lastTimestamp) {
			for (const toBackfill of this.sequenceless.values()) {
				for (const backfillEvent of toBackfill) {
					backfillEvent.sequence = backfillEvent.timestamp
				}
			}

			this.sequenceless.clear()
			this.sequences.clear()
		}

		// Key events on action ID and the source actor ID to make sure we don't match actions from different actors at the same timestamp
		const eventKey = `${cause.action}|${event.source}`

		if (event.sequence != null) {
			// This event has a sequence, record it for the action, and backfill any
			// matching sequenceless events.
			this.sequences.set(eventKey, event.sequence)

			const toBackfill = this.sequenceless.get(eventKey) ?? []
			this.sequenceless.delete(eventKey)
			for (const backfillEvent of toBackfill) {
				backfillEvent.sequence = event.sequence
			}
		} else {
			// Event doesn't have a sequence, check if there's a matching event to provide a sequence id
			const matchingSequence = this.sequences.get(eventKey)

			if (matchingSequence != null) {
				// Set this event's sequence to the matched event
				event.sequence = matchingSequence
			} else {
				// We've got nothing - record it as sequenceless and hopefully pick it up later.
				let toBackfill = this.sequenceless.get(eventKey)
				if (toBackfill == null) {
					toBackfill = []
					this.sequenceless.set(eventKey, toBackfill)
				}
				toBackfill.push(event)
			}
		}

		this.lastTimestamp = event.timestamp

		return event
	}
}
