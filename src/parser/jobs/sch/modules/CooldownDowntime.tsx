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
}
