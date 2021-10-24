import {Event, Events} from 'event'
import {FflogsEvent} from 'fflogs'
import {AdapterStep} from './base'

// Time between the apply and the applystack permitted for merging
const PERMITTED_TIME_DELTA = 0

/**
 * FFLogs models the application of a status with a data field as an
 * apply, followed by an applystack with duplicate info. We don't make
 * the distinction (as it's irrelevant in XIV), merge the two back together.
 */
export class DeduplicateStatusApplicationStep extends AdapterStep {
	private activeStatuses = new Map<string, Events['statusApply']>();

	override adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]): Event[] {
		const out: Event[] = []
		for (const event of adaptedEvents) {
			const adapted = event.type === 'statusApply'
				? this.adaptStatusApply(event)
				: event
			adapted && out.push(adapted)
		}
		return out
	}

	private adaptStatusApply(event: Events['statusApply']): Event | undefined {
		const key = buildStatusKey(event)

		// No data, record it for later and pass on
		if (event.data == null) {
			this.activeStatuses.set(key, event)
			return event
		}

		// If there's no previous application, or it was at a different timestamp, pass on
		const previousApply = this.activeStatuses.get(key)
		if (
			previousApply == null
			|| event.timestamp - previousApply.timestamp > PERMITTED_TIME_DELTA
		) {
			return event
		}

		// We got a match - update the previous event with the data, and noop this one
		previousApply.data = event.data
		return undefined
	}
}

const buildStatusKey = (event: Events['statusApply']) =>
	`${event.source}|${event.target}|${event.status}`
