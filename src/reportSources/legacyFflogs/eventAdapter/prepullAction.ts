import {Event} from 'event'
import {AdapterStep, PREPULL_OFFSETS} from './base'

export class PrepullActionAdapterStep extends AdapterStep {
	postprocess(adaptedEvents: Event[]): Event[] {
		const precastEvents: Event[] = []

		for (const event of adaptedEvents) {
			if (event.type === 'damage' && event.cause.type === 'action') {
				// Create a new action event and push it to the front of the adapted events
				// Ignore damage from over time effects (cause.type will be status) - these shouldn't happen before the first action anyway, but type safety
				precastEvents.push({
					type: 'action',
					action: event.cause.action,
					source: event.source,
					target: event.target,
					timestamp: this.pull.timestamp + PREPULL_OFFSETS.PULL_ACTION,
				})
			} else if (event.type === 'action') {
				// Stop once we hit the first real action event post-pull
				break
			}
		}

		return precastEvents.length > 0
			? [...precastEvents, ...adaptedEvents]
			: adaptedEvents
	}
}
