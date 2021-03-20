import {Event} from 'event'
import {FflogsEvent} from 'fflogs'
import {Pull, Report} from 'report'

// This stuff will probably be moved to a shared location for other sources to use

export interface AdapterOptions {
	report: Report
	pull: Pull
}

export abstract class AdapterStep {
	protected report: Report
	protected pull: Pull

	constructor(opts: AdapterOptions) {
		this.report = opts.report
		this.pull = opts.pull
	}

	/**
	 * Perform logic to adapt a report source event into zero or more xiva events.
	 * This will be called once with each report source event, in the order provided
	 * by the source.
	 */
	adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]): Event[] {
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
