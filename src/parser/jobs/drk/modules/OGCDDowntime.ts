import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

export class OGCDDowntime extends CooldownDowntime {
	override trackedCds = [
		{
			cooldowns: [this.data.actions.DELIRIUM],
			firstUseOffset: 10000,
		},
		{
			cooldowns: [this.data.actions.SALTED_EARTH],
			firstUseOffset: 12500,
		},
		{
			cooldowns: [this.data.actions.CARVE_AND_SPIT, this.data.actions.ABYSSAL_DRAIN],
			firstUseOffset: 17500,
		},
		{
			cooldowns: [this.data.actions.SHADOWBRINGER],
			firstUseOffset: 20000,
		},
		{
			cooldowns: [this.data.actions.LIVING_SHADOW],
			firstUseOffset: 5000,
		},
	]
}
