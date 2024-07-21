import {CooldownDowntime as CoreCooldownDowntime} from 'parser/core/modules/CooldownDowntime'

export class CooldownDowntime extends CoreCooldownDowntime {
	static override debug = false
	trackedCds = [
		{
			cooldowns: [this.data.actions.FIGHT_OR_FLIGHT],
			// Standard opener uses after 3rd GCD
			firstUseOffset: 7500,
		},
		{
			cooldowns: [this.data.actions.IMPERATOR],
			// Standard opener uses after 3rd GCD
			firstUseOffset: 7500,
		},
		{
			cooldowns: [this.data.actions.EXPIACION],
			// Standard opener uses after 4th GCD
			firstUseOffset: 10000,
		},
		{
			cooldowns: [this.data.actions.CIRCLE_OF_SCORN],
			// Standard opener uses after 4th GCD
			firstUseOffset: 10000,
		},
		{
			cooldowns: [this.data.actions.INTERVENE],
			// Standard opener uses after 5th GCD
			firstUseOffset: 12500,
		},
		{
			cooldowns: [this.data.actions.GORING_BLADE],
			// Standard opener uses this as the 5th GCD
			firstUseOffset: 12500,
		},
	]
}
