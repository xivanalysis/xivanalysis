import { getAction } from 'data/ACTIONS'
import Module from 'parser/core/Module'

export default class CastTime extends Module {
	forEvent(event) {
		const action = getAction(event.ability.guid)
		return action.castTime
	}
}
