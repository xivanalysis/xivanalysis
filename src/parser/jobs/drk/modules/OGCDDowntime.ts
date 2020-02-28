import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

const DEFAULT_FIRST_USE_OFFSET = 17500

export class OGCDDowntime extends CooldownDowntime {
	defaultFirstUseOffset = DEFAULT_FIRST_USE_OFFSET
	trackedCds = [
		{
			cooldowns: [ACTIONS.BLOOD_WEAPON],
			firstUseOffset: 2500,
		},
		{
			cooldowns: [ACTIONS.DELIRIUM],
			firstUseOffset: 15000,
		},
		{cooldowns: [ACTIONS.PLUNGE]},
		{cooldowns: [ACTIONS.SALTED_EARTH]},
		{cooldowns: [ACTIONS.CARVE_AND_SPIT]},
		{cooldowns: [ACTIONS.ABYSSAL_DRAIN]},
		{
			cooldowns: [ACTIONS.LIVING_SHADOW],
			firstUseOffset: 10000,
		},
	]
}
