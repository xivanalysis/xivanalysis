import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

const DEFAULT_FIRST_USE_OFFSET = 25000

export default class OGCDDowntime extends CooldownDowntime {
	defaultFirstUseOffset = DEFAULT_FIRST_USE_OFFSET
	trackedCds = [
		{cooldowns: [ACTIONS.HIGH_JUMP]},
		{cooldowns: [ACTIONS.SPINESHATTER_DIVE]},
		{cooldowns: [ACTIONS.DRAGONFIRE_DIVE]},
	]
}
