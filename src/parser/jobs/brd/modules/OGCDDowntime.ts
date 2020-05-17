/**
 * @author Yumiya
 */
import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

export default class OGCDDowntime extends CooldownDowntime {
	trackedCds = [
		{
			cooldowns: [ACTIONS.BATTLE_VOICE],
			firstUseOffset: 4500,
		},
		{
			cooldowns: [ACTIONS.RAGING_STRIKES],
			firstUseOffset: -1000,
		},
		{
			cooldowns: [ACTIONS.BARRAGE],
			firstUseOffset: 12000,
		},
		{
			cooldowns: [
				ACTIONS.SIDEWINDER,
				ACTIONS.SHADOWBITE,
			],
			firstUseOffset: 12000,
		},
	]

	checklistTarget = 100
}
