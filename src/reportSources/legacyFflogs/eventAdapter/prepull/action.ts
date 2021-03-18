import {Event, Events} from 'event'
import {FflogsEvent} from 'fflogs'
import {AdapterStep} from '../base'

export class PrepullActionAdapterStep extends AdapterStep {
	private finished = false

	adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]): Event[] {
		const synthesizedEvents: Event[] = []

		if (this.finished) {
			return adaptedEvents
		}

		for (const event of adaptedEvents) {
			if (event.type === 'action') {
				// Stop once we hit the first real action event post-pull
				this.finished = true
			} else if (event.type === 'snapshot') {
				synthesizedEvents.push(this.synthesizeActionEvent(event))
			}
		}

		return [...synthesizedEvents, ...adaptedEvents]
	}

	private synthesizeActionEvent(event: Events['snapshot']): Events['action'] {
		return {
			...event,
			type: 'action',
			timestamp: this.pull.timestamp,
		}
	}
}
