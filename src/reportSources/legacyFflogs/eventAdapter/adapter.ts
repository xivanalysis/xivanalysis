import {Event} from 'event'
import {FflogsEvent} from 'fflogs'
import {sortEvents} from 'parser/core/EventSorting'
import {Pull, Report} from 'report'
import {AdapterOptions, AdapterStep} from './base'
import {DeduplicateActorUpdateStep} from './deduplicateActorUpdates'
import {DeduplicateAoEStep} from './deduplicateAoE'
import {DeduplicateStatusApplicationStep} from './deduplicateStatus'
import {InterruptsAdapterStep} from './interrupts'
import {OneHpLockAdapterStep} from './oneHpLock'
import {PrepullActionAdapterStep} from './prepullAction'
import {PrepullStatusAdapterStep} from './prepullStatus'
import {ReassignUnknownActorStep} from './reassignUnknownActor'
import {SpeedStatsAdapterStep} from './speedStat'
import {TranslateAdapterStep} from './translate'

/** Adapt an array of FFLogs APIv1 events to xiva representation. */
export function adaptEvents(report: Report, pull: Pull, baseEvents: FflogsEvent[]): Event[] {
	const adapter = new EventAdapter({report, pull})

	// Shallow clone to ensure top-level updates will not effect the base array.
	// Child adapters are responsible for ensuring updates are copy-on-write.
	const events = [...baseEvents]

	// TODO: Move sort logic into adapter scope once legacy is removed
	sortEvents(events)

	return adapter.adaptEvents(events)
}

class EventAdapter {
	private adaptionSteps: AdapterStep[]

	constructor(opts: AdapterOptions) {
		this.adaptionSteps = [
			new ReassignUnknownActorStep(opts),
			new TranslateAdapterStep(opts),
			new InterruptsAdapterStep(opts),
			new DeduplicateAoEStep(opts),
			new DeduplicateStatusApplicationStep(opts),
			new DeduplicateActorUpdateStep(opts),
			new PrepullActionAdapterStep(opts),
			new PrepullStatusAdapterStep(opts),
			new OneHpLockAdapterStep(opts),
			new SpeedStatsAdapterStep(opts),
		]
	}

	adaptEvents(events: FflogsEvent[]): Event[] {
		const adaptedEvents = events.flatMap(baseEvent =>
			this.adaptionSteps.reduce(
				(adaptedEvents, step) => {
					let result = step.adapt(baseEvent, adaptedEvents)

					if (!Array.isArray(result)) {
						baseEvent = result.dangerouslyMutatedBaseEvent
						result = result.adaptedEvents
					}

					return result
				},
				[] as Event[]
			)
		)

		return this.adaptionSteps.reduce(
			(processedEvents, step) => step.postprocess(processedEvents),
			adaptedEvents,
		)
	}
}
