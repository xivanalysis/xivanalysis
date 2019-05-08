import {Fflogs} from '@xivanalysis/parser-reader-fflogs'
import stable from 'stable'

const EVENT_TYPE_ORDER: Record<string, number> = {
	death: -4,
	begincast: -3,
	cast: -2,
	damage: -1,
	heal: -1,
	default: 0,
	removebuff: 1,
	removebuffstack: 1,
	removedebuff: 1,
	removedebuffstack: 1,
	refreshbuff: 2,
	refreshdebuff: 2,
	applybuff: 3,
	applybuffstack: 3,
	applydebuff: 3,
	applydebuffstack: 3,
}

export function mergeEvents(existing: Fflogs.Event[], incoming: Fflogs.Event[]) {
	// Create a new array with the incoming events at the end
	const events = existing.concat(incoming)

	// Sort them in place
	stable.inplace(events, (a, b) => {
		if (a.timestamp === b.timestamp) {
			const aTypeOrder = EVENT_TYPE_ORDER[a.type as string] || EVENT_TYPE_ORDER.default
			const bTypeOrder = EVENT_TYPE_ORDER[b.type as string] || EVENT_TYPE_ORDER.default
			return aTypeOrder - bTypeOrder
		}
		return a.timestamp - b.timestamp
	})

	return events
}
