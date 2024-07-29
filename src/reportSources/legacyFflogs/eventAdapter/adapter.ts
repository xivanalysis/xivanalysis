import {Event} from 'event'
import {Pull, Report} from 'report'
import {FflogsEvent} from '../eventTypes'
import {AssignOverhealStep} from './assignOverheal'
import {AdapterOptions, AdapterStep} from './base'
import {DeduplicateActorUpdateStep} from './deduplicateActorUpdates'
import {DeduplicateAoEStep} from './deduplicateAoE'
import {DeduplicateStatusApplicationStep} from './deduplicateStatus'
import {ErroneousFriendDeathAdapterStep} from './erroneousFriendDeath'
import {InterruptsAdapterStep} from './interrupts'
import {MergeActorInstancesStep} from './mergeActorInstance'
import {OneHpLockAdapterStep} from './oneHpLock'
import {PrepullActionAdapterStep} from './prepullAction'
import {PrepullStatusAdapterStep} from './prepullStatus'
import {ReassignUnknownActorStep} from './reassignUnknownActor'
import {SortStatusAdapterStep} from './sortStatus'
import {SpeedStatsAdapterStep} from './speedStat'
import {TranslateAdapterStep} from './translate'

/** Adapt an array of FFLogs APIv1 events to xiva representation. */
export function adaptEvents(report: Report, pull: Pull, baseEvents: FflogsEvent[], firstEvent: number): Event[] {
	const adapter = new EventAdapter({report, pull})

	// Shallow clone to ensure top-level updates will not effect the base array.
	// Child adapters are responsible for ensuring updates are copy-on-write.
	const events = [...baseEvents]

	return adapter.adaptEvents(events, firstEvent)
}

class EventAdapter {
	private adaptionSteps: AdapterStep[]

	constructor(opts: AdapterOptions) {
		this.adaptionSteps = [
			new ReassignUnknownActorStep(opts),
			new MergeActorInstancesStep(opts),
			new TranslateAdapterStep(opts),
			new ErroneousFriendDeathAdapterStep(opts),
			new AssignOverhealStep(opts),
			new InterruptsAdapterStep(opts),
			new DeduplicateAoEStep(opts),
			new DeduplicateStatusApplicationStep(opts),
			new DeduplicateActorUpdateStep(opts),
			new SortStatusAdapterStep(opts),
			new PrepullActionAdapterStep(opts),
			new PrepullStatusAdapterStep(opts),
			new OneHpLockAdapterStep(opts),
			new SpeedStatsAdapterStep(opts),
		]
	}

	adaptEvents(events: FflogsEvent[], firstEvent: number): Event[] {
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
			(processedEvents, step) => step.postprocess(processedEvents, firstEvent),
			adaptedEvents,
		)
	}
}
