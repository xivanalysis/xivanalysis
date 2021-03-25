import {Event} from 'event'
import {FflogsEvent} from 'fflogs'
import {Pull, Report} from 'report'
import {AdapterOptions, AdapterStep} from './base'
import {DeduplicateActorUpdateStep} from './deduplicateActorUpdates'
import {DeduplicateStatusApplicationStep} from './deduplicateStatus'
import {PrepullActionAdapterStep} from './prepullAction'
import {PrepullStatusAdapterStep} from './prepullStatus'
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
			new PrepullStatusAdapterStep(opts),
		]
	}

	adaptEvents(events: FflogsEvent[]): Event[] {
		const adaptedEvents = events.flatMap(baseEvent =>
			this.adaptionSteps.reduce(
				(adaptedEvents, step) => step.adapt(baseEvent, adaptedEvents),
				[] as Event[]
			)
		)

		return this.adaptionSteps.reduce(
			(processedEvents, step) => step.postprocess(processedEvents),
			adaptedEvents,
		)
	}
}
