import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

export default class GeneralCDDowntime extends CooldownDowntime {

	trackedCds = [{
		cooldowns: [
			this.data.actions.SUMMON_BAHAMUT,
			this.data.actions.SUMMON_PHOENIX,
		],
		firstUseOffset: 4500, //may use 2 Ruin 3's before summoning to ensure Searing Light does not ghost
		//isAffectedBySpeed: true,
	}, {
		cooldowns: [
			this.data.actions.SMN_ENERGY_DRAIN,
			this.data.actions.ENERGY_SIPHON,
		],
		firstUseOffset: 7500, //Energy drain comes after first Astral Impulse, which is 1 GCD after summon
	}, {
		cooldowns: [
			this.data.actions.SEARING_LIGHT,
		],
		firstUseOffset: 3500, //comes after either pre-pull Ruin 3 or a second Ruin 3 on pull
	},
	]

}
