import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {AdapterStep} from './base'
import {FflogsEvent} from '../eventTypes'

/**
 * FFLogs models damage events that hit multiple targets as separate events with the same SequenceID and timestamp.
 * However, if one event fails to hit (miss or an invuln target), then the sequence ID will be omitted from the failed hit.
 * We need to readd the omitted SequenceID so that AOE deduplication will work correctly
 * NOTE: this adapter step MUST run before DeduplicateAoEStep or it won't have any effect
 */
export class FixMissEventSequenceIDStep extends AdapterStep {
	private lastTimestamp = -1
	private sequenceless = new Map<Action['id'], Array<Events['damage']>>()
	private sequences = new Map<Action['id'], number>()

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

		const lastSequence = this.sequences.get(cause.action)

		if (event.sequence != null) {
			// This event has a sequence, record it for the action, and backfill any
			// matching sequenceless events.
			this.sequences.set(cause.action, event.sequence)

			const toBackfill = this.sequenceless.get(cause.action) ?? []
			this.sequenceless.delete(cause.action)
			for (const backfillEvent of toBackfill) {
				backfillEvent.sequence = event.sequence
			}
		} else if (lastSequence != null) {
			// Event doesn't have a sequence, use the one from the last matching cause.
			event.sequence = lastSequence
		} else {
			// We've got nothing - record it as sequenceless and hopefully pick it up later.
			let toBackfill = this.sequenceless.get(cause.action)
			if (toBackfill == null) {
				toBackfill = []
				this.sequenceless.set(cause.action, toBackfill)
			}
			toBackfill.push(event)
		}

		this.lastTimestamp = event.timestamp

		return event
	}
}
