import stable from 'stable'
import {FflogsEvent} from '../eventTypes'

const EVENT_TYPE_ORDER: Partial<Record<FflogsEvent['type'], number>> = {
	death: -4,
	begincast: -3,
	cast: -2,
	calculateddamage: -1.5,
	calculatedheal: -1.5,
	targetabilityupdate: -1,
	damage: -0.5,
	heal: -0.5,
	// Keep apply/remove/refresh (de)buff events in the same order as they were originally sent by the FFLogs API
	applybuff: 1,
	applybuffstack: 1,
	applydebuff: 1,
	applydebuffstack: 1,
	removebuff: 1,
	removebuffstack: 1,
	removedebuff: 1,
	removedebuffstack: 1,
	refreshbuff: 1,
	refreshdebuff: 1,
}
const DEFAULT_ORDER = 0

export function sortEvents(events: FflogsEvent[]) {
	return stable.inplace(events, (a, b) => {
		if (a.timestamp !== b.timestamp) {
			return a.timestamp - b.timestamp
		}

		const aTypeOrder = EVENT_TYPE_ORDER[a.type] ?? DEFAULT_ORDER
		const bTypeOrder = EVENT_TYPE_ORDER[b.type] ?? DEFAULT_ORDER
		return aTypeOrder - bTypeOrder
	})
}
