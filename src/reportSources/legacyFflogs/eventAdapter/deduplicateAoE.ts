import {Event, Events} from 'event'
import {AdapterStep} from './base'

type SequencedEvent = Events['damage' | 'heal']

/**
 * FFLogs models damage or healing events that hit multiple targets as separate events
 * with the same SequenceID and timestamp.  The actual event stream models them in a single AoE packet
 * and we need to deduplicate to ensure that the results of a damage event (e.g. building gauge) only occur once per action
 */
export class DeduplicateAoEStep extends AdapterStep {
	private deduplicatedEvents: Event[] = []
	private sequenceMapping = new Map<string, SequencedEvent>()

	override postprocess(adaptedEvents: Event[]) {
		for (const adaptedEvent of adaptedEvents) {
			const matchingEvent = this.getMatchingEvent(adaptedEvent)
			if (matchingEvent == null) {
				this.deduplicatedEvents.push(adaptedEvent)
				continue
			}

			// N.B.: For performance reasons, we are not cloning the events, just working with them as-is and keeping track of which events we want to keep in the deduplicatedEvents array
			//   Separate array for the return so we don't mess with the iterator of our forEach, but just add the events onto the dedupe array as references - no cloning
			//   This means that if you're debugging, the targets property of events will change in both the adaptedEvents and deduplicatedEvents arrays as you step through things
			if (adaptedEvent.type === 'damage') {
				(matchingEvent as Events['damage']).targets.push(adaptedEvent.targets[0])
			}
			if (adaptedEvent.type === 'heal') {
				(matchingEvent as Events['heal']).targets.push(adaptedEvent.targets[0])
			}
		}

		return this.deduplicatedEvents
	}

	private getMatchingEvent(event: Event): SequencedEvent | undefined {
		if (
			// Only damage/heal are paired.
			!(event.type === 'damage' || event.type === 'heal')
			// Events with no sequence ID are from over time effects or the passive regeneration, do not deduplicate.
			|| event.sequence == null
		) {
			return
		}

		const mappingKey = `${event.type}:${event.sequence}`
		const match = this.sequenceMapping.get(mappingKey)

		// If there was no match, record this event as the first.
		// NOTE: We don't return the current event in this case, as it would result in a self-recursive object!
		if (match == null) {
			this.sequenceMapping.set(mappingKey, event)
		}

		return match
	}
}
