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

		return this.deduplicatedEvents.find(e => e.type === event.type && e.sequence === event.sequence)
	}

}
