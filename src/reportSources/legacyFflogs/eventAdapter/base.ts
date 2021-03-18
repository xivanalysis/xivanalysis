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

	abstract adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]): Event[]
}
