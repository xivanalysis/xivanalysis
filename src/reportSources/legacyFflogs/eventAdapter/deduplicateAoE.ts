import {Event, Events} from 'event'
import {AdapterStep} from './base'

/**
 * FFLogs models damage or healing events that hit multiple targets as separate events
 * with the same SequenceID and timestamp.  The actual event stream models them in a single AoE packet
 * and we need to deduplicate to ensure that the results of a damage event (e.g. building gauge) only occur once per action
 */
export class DeduplicateAoEStep extends AdapterStep {
	private deduplicatedEvents: Event[] = []

	override postprocess(adaptedEvents: Event[]) {

		adaptedEvents.forEach(adaptedEvent => {
			// N.B.: For performance reasons, we are not cloning the events, just working with them as-is and keeping track of which events we want to keep in the deduplicatedEvents array
			//   Separate array for the return so we don't mess with the iterator of our forEach, but just add the events onto the dedupe array as references - no cloning
			//   This means that if you're debugging, the targets property of events will change in both the adaptedEvents and deduplicatedEvents arrays as you step through things
			const matchingEvent = this.getMatchingEvent(adaptedEvent)
			if (matchingEvent != null) {
				if (adaptedEvent.type === 'damage') {
					(matchingEvent as Events['damage']).targets.push(adaptedEvent.targets[0])
				}
				if (adaptedEvent.type === 'heal') {
					(matchingEvent as Events['heal']).targets.push(adaptedEvent.targets[0])
				}
			} else {
				this.deduplicatedEvents.push(adaptedEvent)
			}
		})

		return this.deduplicatedEvents
	}

	private getMatchingEvent(event: Event): Event | undefined {
		if (!(event.type === 'damage' || event.type === 'heal')) {
			return undefined
		}

		// Events with no sequence ID are from over time effects or the passive regeneration, do not deduplicate
		return this.deduplicatedEvents.find(e => e.type === event.type && e.sequence != null && e.sequence === event.sequence)
	}

}
