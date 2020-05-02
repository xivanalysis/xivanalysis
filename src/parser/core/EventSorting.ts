import {Event} from 'fflogs'
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
	applybuff: 1,
	applybuffstack: 1,
	applydebuff: 1,
	applydebuffstack: 1,
	normalisedapplybuff: 1.5,
	removebuff: 2,
	removebuffstack: 2,
	removedebuff: 2,
	removedebuffstack: 2,
	normalisedremovebuff: 2.5,
	refreshbuff: 3,
	refreshdebuff: 3,
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
