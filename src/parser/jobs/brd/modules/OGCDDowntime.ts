/**
 * @author Yumiya
 */
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

export default class OGCDDowntime extends CooldownDowntime {
	override trackedCds = [
		{
			cooldowns: [this.data.actions.BATTLE_VOICE],
			firstUseOffset: 7500,
		},
		{
			cooldowns: [this.data.actions.RADIANT_FINALE],
			firstUseOffset: 7500,
			allowedAverageDowntime: 10000,
		},
		{
			cooldowns: [this.data.actions.RAGING_STRIKES],
			firstUseOffset: 2500,
		},
		{
			cooldowns: [this.data.actions.BARRAGE],
			firstUseOffset: 12000,
		},
		{
			cooldowns: [this.data.actions.SIDEWINDER],
			firstUseOffset: 12000,
		},
	]
}
