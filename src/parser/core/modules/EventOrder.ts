import {Event} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import stable from 'stable'
import AdditionalEvents from './AdditionalEvents'
import {NormalisedEvents} from './NormalisedEvents'

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

const getEventOrder = (event: Event) => {
	const order = typeof event.type === 'string'
		? EVENT_TYPE_ORDER[event.type]
		: undefined

	return order ?? EVENT_TYPE_ORDER.default
}

export class EventOrder extends Module {
	static handle = 'eventOrder'

	/* NOTE:
	 * "Dependencies" listed here are modules that _must_ normalise before this
	 * module, as they rely on the sorting logic below to merge events in properly.
	 * You almost certainly do not need to add to this list. If you're _certain_ you
	 * do, please bring it up in #dev-general to make sure other people are across
	 * the change, and there's no better way of approaching the base problem.
	 */
	@dependency additionalEvents!: AdditionalEvents
	@dependency normalisedEvents!: NormalisedEvents

	normalise(events: Event[]) {
		return stable.inplace(events, (a, b) => {
			if (a.timestamp === b.timestamp) {
				return getEventOrder(a) - getEventOrder(b)
			}
			return a.timestamp - b.timestamp
		})
	}
}
