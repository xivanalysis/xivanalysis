import {Cause, Event} from 'event'
import {filter} from 'parser/core/filter'
import {AdapterStep} from './base'

/**
 * FFLogs models damage events that hit multiple targets as separate events with the same SequenceID and timestamp.
 * However, if one event fails to hit (miss or an invuln target), then the sequence ID will be omitted from the failed hit.
 * We need to readd the omitted SequenceID so that AOE deduplication will work correctly
 * NOTE: this adapter step MUST run before DeduplicateAoEStep or it won't have any effect
 */
export class FixMissEventSequenceIDStep extends AdapterStep {
	override postprocess(adaptedEvents: Event[]) {
		const actionEventFilter = filter<Event>().type('damage').cause(filter<Cause>().type('action'))
		const actionEvents = adaptedEvents.filter(actionEventFilter)

		const missEvents = actionEvents.filter(e => e.sequence == null)
		for (const missEvent of missEvents) {
			const matchingAction = actionEvents.find(e => e.sequence != null &&
														  e.timestamp === missEvent.timestamp &&
														  e.cause.type === "action" && missEvent.cause.type === "action" &&
														  e.cause.action === missEvent.cause.action)
			if (matchingAction != null) {
				missEvent.sequence = matchingAction.sequence
			} else {
				missEvent.sequence = missEvent.timestamp
			}
		}

		return adaptedEvents
	}
}
