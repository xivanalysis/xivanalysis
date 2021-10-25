import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

const DEFAULT_FIRST_USE_OFFSET = 17500

export class OGCDDowntime extends CooldownDowntime {
	override defaultFirstUseOffset = DEFAULT_FIRST_USE_OFFSET
	override trackedCds = [
		{
			cooldowns: [this.data.actions.BLOOD_WEAPON],
			firstUseOffset: 2500,
		},
		{
			cooldowns: [this.data.actions.DELIRIUM],
			firstUseOffset: 15000,
		},
		{cooldowns: [this.data.actions.PLUNGE]},
		{cooldowns: [this.data.actions.SALTED_EARTH]},
		{cooldowns: [this.data.actions.CARVE_AND_SPIT]},
		{cooldowns: [this.data.actions.ABYSSAL_DRAIN]},
		{
			cooldowns: [this.data.actions.LIVING_SHADOW],
			firstUseOffset: 10000,
		},
	]
}
