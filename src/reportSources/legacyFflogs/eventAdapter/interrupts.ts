import {Event, Events} from 'event'
import {Actor} from 'report'
import {FflogsEvent} from '../eventTypes'
import {AdapterStep} from './base'

export class InterruptsAdapterStep extends AdapterStep {
	private casts = new Map<Actor['id'], number>()

	override adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]): Event[] {
		const interrupts: Array<Events['interrupt']> = []

		for (const event of adaptedEvents) {
			if (event.type === 'prepare') {
				// If there's an existing cast, this prepare likely signals an interrupt
				const action = this.casts.get(event.source)
				if (action != null) {
					interrupts.push(this.fromEvent(event, action))
				}

				// Mark the prepared action as being cast
				this.casts.set(event.source, event.action)

			} else if (event.type === 'action') {
				// If the action doesn't match the cast, it's likely an instant cast
				// following an interrupted hard cast
				const action = this.casts.get(event.source)
				if (action != null && action !== event.action) {
					interrupts.push(this.fromEvent(event, action))
				}

				// Clear any further cast state
				this.casts.delete(event.source)
			}
		}

		// NOTE: This assumes that no single set of adapted events will contain start-
		//       to-end an interruption sequence. Given fflogs, this is a safe assumption.
		//       Double check before moving to any other report source.
		return interrupts.length > 0
			? [...interrupts, ...adaptedEvents]
			: adaptedEvents
	}

	private fromEvent(
		event: Events['prepare'] | Events['action'],
		action: number
	): Events['interrupt'] {
		return {
			type: 'interrupt',
			timestamp: event.timestamp,
			// TODO: Work out if it's possible to find the true source of the interruption.
			//       Using source for now, as it's a reasonably safe bet for players.
			source: event.source,
			target: event.source,
			action,
		}
	}
}
