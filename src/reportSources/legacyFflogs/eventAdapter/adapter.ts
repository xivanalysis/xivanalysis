import {Event} from 'event'
import {FflogsEvent} from 'fflogs'
import {Report} from 'report'
import {AdapterStep} from './base'
import {DeduplicateActorUpdateStep} from './deduplicateActorUpdates'
import {DeduplicateStatusApplicationStep} from './deduplicateStatus'
import {TranslateAdapterStep} from './translate'

/** Adapt an array of FFLogs APIv1 events to xiva representation. */
export function adaptEvents(report: Report, events: FflogsEvent[]): Event[] {
	const adapter = new EventAdapter({report})
	return adapter.adaptEvents(events)
}

class EventAdapter {
	private adaptionSteps: AdapterStep[]

	constructor({report}: {report: Report}) {
		this.adaptionSteps = [
			new TranslateAdapterStep({report}),
			new DeduplicateStatusApplicationStep({report}),
			new DeduplicateActorUpdateStep({report}),
		]
	}

	adaptEvents(events: FflogsEvent[]): Event[] {
		return events.flatMap(baseEvent => this.adaptionSteps.reduce(
			(adaptedEvents, step) => step.adapt(baseEvent, adaptedEvents),
			[] as Event[],
		))
	}
}
