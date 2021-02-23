import {Event} from 'event'
import {FflogsEvent} from 'fflogs'
import {Report} from 'report'

// This stuff will probably be moved to a shared location for other sources to use

export abstract class AdapterStep {
	protected report: Report
	constructor(opts: {report: Report}) {
		this.report = opts.report
	}

	abstract adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]): Event[]
}
