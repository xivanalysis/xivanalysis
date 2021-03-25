import {Event, Events} from 'event'
import {AdapterStep} from './base'

export class PrepullActionAdapterStep extends AdapterStep {
	postprocess(adaptedEvents: Event[]): Event[] {
		const precastEvents: Event[] = []

		for (const event of adaptedEvents) {
			if (event.type === 'snapshot') {
				// Create a new action event and push it to the front of the adapted events
				precastEvents.push(this.synthesizeActionEvent(event))
			} else if (event.type === 'action') {
				// Stop once we hit the first real action event post-pull
				break
			}
		}

		return precastEvents.length > 0
			? [...precastEvents, ...adaptedEvents]
			: adaptedEvents
	}

	private synthesizeActionEvent(event: Events['snapshot']): Events['action'] {
		return {
			...event,
			type: 'action',
			timestamp: this.pull.timestamp,
		}
	}
}
