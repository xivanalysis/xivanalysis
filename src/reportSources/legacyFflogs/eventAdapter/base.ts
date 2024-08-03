import {Event} from 'event'
import {Debuggable} from 'parser/core/Debuggable'
import {Pull, Report} from 'report'
import {FflogsEvent} from '../eventTypes'

// Time (in MS) to offset prepull synthesized events from the first event in the pull
export const PREPULL_OFFSETS = {
	ATTRIBUTE_UPDATE: -400,
	STATUS_ACTION: -300,
	STATUS_APPLY: -200,
	PULL_ACTION: -100,
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
	postprocess(adaptedEvents: Event[], _firstEvent: number): Event[] {
		return adaptedEvents
	}
}
