import {Event} from 'event'
import {FflogsEvent} from 'fflogs'
import {Pull, Report} from 'report'
import {AdapterOptions, AdapterStep} from './base'
import {DeduplicateActorUpdateStep} from './deduplicateActorUpdates'
import {DeduplicateStatusApplicationStep} from './deduplicateStatus'
import {PrepullActionAdapterStep} from './prepull/action'
import {TranslateAdapterStep} from './translate'

/** Adapt an array of FFLogs APIv1 events to xiva representation. */
export function adaptEvents(report: Report, pull: Pull, events: FflogsEvent[]): Event[] {
	const adapter = new EventAdapter({report, pull})
	return adapter.adaptEvents(events)
}

class EventAdapter {
	private adaptionSteps: AdapterStep[]

	constructor(opts: AdapterOptions) {
		this.adaptionSteps = [
			new TranslateAdapterStep(opts),
			new DeduplicateStatusApplicationStep(opts),
			new DeduplicateActorUpdateStep(opts),
			new PrepullActionAdapterStep(opts),
		]
	}

	adaptEvents(events: FflogsEvent[]): Event[] {
		return events
			.map(baseEvent => this.adaptionSteps
				.reduce((adaptedEvents, step) => step.adapt(baseEvent, adaptedEvents),
				[] as Event[]))
			.flat()
	}
}
