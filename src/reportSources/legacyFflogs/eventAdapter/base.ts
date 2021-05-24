import {Event} from 'event'
import {EventActor, FflogsEvent} from 'fflogs'
import {Debuggable} from 'parser/core/Debuggable'
import {Actor, Pull, Report} from 'report'

export function resolveActorId(opts: {
	id?: number,
	instance?: number,
	actor?: EventActor
}): Actor['id'] {
	const idNum = (opts.id ?? opts.actor?.id ?? -1)
	const id = idNum === -1 ? 'unknown' : idNum.toString()
	const instance = opts.instance ?? 1
	return instance > 1
		? `${id}:${instance}`
		: id
}

export const PREPULL_OFFSETS = {
	ATTRIBUTE_UPDATE: -4,
	STATUS_ACTION: -3,
	STATUS_APPLY: -2,
	PULL_ACTION: -1,
}

// This stuff will probably be moved to a shared location for other sources to use

export interface AdapterOptions {
	report: Report
	pull: Pull
}

// TODO: Remove this once the legacy system is phased out - we only need explicit mutation handling
// while the legacy system is actually using these events
export interface MutationAdaptionResult {
	dangerouslyMutatedBaseEvent: FflogsEvent
	adaptedEvents: Event[]
}

export abstract class AdapterStep extends Debuggable {
	protected report: Report
	protected pull: Pull

	constructor(opts: AdapterOptions) {
		super()
		this.report = opts.report
		this.pull = opts.pull
	}

	/**
	 * Perform logic to adapt a report source event into zero or more xiva events.
	 * This will be called once with each report source event, in the order provided
	 * by the source.
	 */
	adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]): Event[] | MutationAdaptionResult {
		return adaptedEvents
	}

	/**
	 * Perform postprocessing on the final array of adapted events. This will be
	 * called once after all report source events have been adapted.
	 */
	postprocess(adaptedEvents: Event[]): Event[] {
		return adaptedEvents
	}
}
