import {Event} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import stable from 'stable'
import AdditionalEvents from './AdditionalEvents'
import {NormalisedEvents} from './NormalisedEvents'

const EVENT_TYPE_ORDER: {[key: string]: number} = {
	death: -70,
	begincast: -60,
	cast: -50,
	calculateddamage: -40,
	calculatedheal: -40,
	normaliseddamage: -30,
	normalisedheal: -30,
	targetabilityupdate: -20,
	damage: -10,
	heal: -10,
	default: 0,
	removebuff: 10,
	removebuffstack: 10,
	removedebuff: 10,
	removedebuffstack: 10,
	refreshbuff: 20,
	refreshdebuff: 20,
	normalisedremovebuff: 30,
	applybuff: 40,
	applybuffstack: 40,
	applydebuff: 40,
	applydebuffstack: 40,
	normalisedapplybuff: 50,
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
