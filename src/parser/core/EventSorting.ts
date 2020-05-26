import {Event} from 'events'
import stable from 'stable'

const EVENT_TYPE_ORDER: {[key: string]: number} = {
	death: -4,
	begincast: -3,
	cast: -2,
	calculateddamage: -1.5,
	calculatedheal: -1.5,
	normaliseddamage: -1.25,
	normalisedheal: -1.25,
	targetabilityupdate: -1,
	damage: -0.5,
	heal: -0.5,
	default: 0,
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
	// Since normalised apply/removebuff events will be generated in the same order as the underlying events were presented, preserve that order
	normalisedapplybuff: 1.5,
	normalisedapplydebuff: 1.5,
	normalisedremovebuff: 1.5,
	normalisedremovedebuff: 1.5,
}

export function sortEvents(events: Event[]) {
	return stable.inplace(events, (a, b) => {
		if (a.timestamp === b.timestamp) {
			const aTypeOrder = (typeof a.type === 'string' ? EVENT_TYPE_ORDER[a.type] : null) || EVENT_TYPE_ORDER.default
			const bTypeOrder = (typeof b.type === 'string' ? EVENT_TYPE_ORDER[b.type] : null) || EVENT_TYPE_ORDER.default
			return aTypeOrder - bTypeOrder
		}
		return a.timestamp - b.timestamp
	})
}
