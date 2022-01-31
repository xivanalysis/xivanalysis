import {CooldownDowntime as CooldownDowntimeCore} from 'parser/core/modules/CooldownDowntime'

export class CooldownDowntime extends CooldownDowntimeCore {
	override trackedCds = [
		{
			cooldowns: [this.data.actions.CHAIN_STRATAGEM],
			firstUseOffset: 10000,
		},
		{
			cooldowns: [this.data.actions.AETHERFLOW],
			firstUseOffset: 7500,
		},
	]
	override defensiveCooldowns = [
		{cooldowns: [this.data.actions.SCH_WHISPERING_DAWN]},
		{cooldowns: [this.data.actions.SCH_FEY_ILLUMINATION]},
		{cooldowns: [this.data.actions.SACRED_SOIL]},
		{cooldowns: [this.data.actions.INDOMITABILITY]},
		{cooldowns: [this.data.actions.DEPLOYMENT_TACTICS]},
		{cooldowns: [this.data.actions.EMERGENCY_TACTICS]},
		{cooldowns: [this.data.actions.DISSIPATION]},
		{cooldowns: [this.data.actions.EXCOGITATION]},
		{cooldowns: [this.data.actions.RECITATION]},
		{cooldowns: [this.data.actions.SUMMON_SERAPH]},
		{cooldowns: [this.data.actions.PROTRACTION]},
		{cooldowns: [this.data.actions.EXPEDIENT]},
	]
}
