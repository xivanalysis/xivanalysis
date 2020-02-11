/**
 * @author Yumiya
 */
import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

export default class OGCDDowntime extends CooldownDowntime {
	trackedCds = [
		{cooldowns: [ACTIONS.BARRAGE]},
		{cooldowns: [ACTIONS.RAGING_STRIKES]},
		{cooldowns: [ACTIONS.SIDEWINDER]},
	]

	checklistTarget = 100
}
