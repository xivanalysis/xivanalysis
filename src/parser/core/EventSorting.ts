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
	removebuff: 1,
	removebuffstack: 1,
	removedebuff: 1,
	removedebuffstack: 1,
	refreshbuff: 2,
	refreshdebuff: 2,
	normalisedremovebuff: 2.5,
	applybuff: 3,
	applybuffstack: 3,
	applydebuff: 3,
	applydebuffstack: 3,
	normalisedapplybuff: 3.5,
}

export function SortEvents(events: Event[]) {
	return stable.inplace(events, (a, b) => {
		if (a.timestamp === b.timestamp) {
			const aTypeOrder = (typeof a.type === 'string' ? EVENT_TYPE_ORDER[a.type] : null) || EVENT_TYPE_ORDER.default
			const bTypeOrder = (typeof b.type === 'string' ? EVENT_TYPE_ORDER[b.type] : null) || EVENT_TYPE_ORDER.default
			return aTypeOrder - bTypeOrder
		}
		return a.timestamp - b.timestamp
	})
}
