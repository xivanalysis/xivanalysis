import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

export default class OGCDDowntime extends CooldownDowntime {
	trackedCds = [
		{cooldowns: [ACTIONS.BLOOD_WEAPON]},
		{cooldowns: [ACTIONS.DELIRIUM]},
		{cooldowns: [ACTIONS.PLUNGE]},
		{cooldowns: [ACTIONS.SALTED_EARTH]},
		{cooldowns: [ACTIONS.CARVE_AND_SPIT]},
		{cooldowns: [ACTIONS.ABYSSAL_DRAIN]},
		{cooldowns: [ACTIONS.LIVING_SHADOW]},
	]
}
