import {Event, Events} from 'event'
import {FflogsEvent} from 'fflogs'
import {isDefined} from 'utilities'
import {AdapterStep} from '../base'

export class PrepullActionAdapterStep extends AdapterStep {
	private finished = false
	private initialEventLocation?: Event[]

	adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]): Event[] {
		if (this.finished) {
			return adaptedEvents
		}

		if (!isDefined(this.initialEventLocation)) {
			this.initialEventLocation = adaptedEvents
		}

		const synthesizedEvents: Event[] = []
		for (const event of adaptedEvents) {
			if (event.type === 'snapshot') {
				// Create a new action event and push it to the front of the adapted events
				const actionEvent = this.synthesizeActionEvent(event)
				synthesizedEvents.push(actionEvent)
			} else if (event.type === 'action') {
				// Stop once we hit the first real action event post-pull
				this.finished = true
			}
		}

		this.initialEventLocation.unshift(...synthesizedEvents)

		return adaptedEvents
	}

	private synthesizeActionEvent(event: Events['snapshot']): Events['action'] {
		return {
			...event,
			type: 'action',
			timestamp: this.pull.timestamp,
		}
	}
}
