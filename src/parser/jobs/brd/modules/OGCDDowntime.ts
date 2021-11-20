/**
 * @author Yumiya
 */
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

export default class OGCDDowntime extends CooldownDowntime {
	override trackedCds = [
		{
			cooldowns: [this.data.actions.BATTLE_VOICE],
			firstUseOffset: 4500,
		},
		{
			cooldowns: [this.data.actions.RAGING_STRIKES],
			firstUseOffset: -1000,
		},
		{
			cooldowns: [this.data.actions.BARRAGE],
			firstUseOffset: 12000,
		},
		{
			cooldowns: [
				this.data.actions.SIDEWINDER,
				this.data.actions.SHADOWBITE,
			],
			firstUseOffset: 12000,
		},
	]

	override checklistTarget = 100
}
