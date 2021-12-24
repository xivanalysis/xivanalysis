import {CooldownDowntime as CoreCooldownDowntime} from 'parser/core/modules/CooldownDowntime'

export class CooldownDowntime extends CoreCooldownDowntime {
	trackedCds = [
		{
			cooldowns: [this.data.actions.ARCANE_CIRCLE],
			// JP opener is after 2nd GCD
			firstUseOffset: 5000,
		},

		{
			cooldowns: [this.data.actions.ENSHROUD],
			// Delayed Enshroud opener is just before 6th GCD
			firstUseOffset: 12500,
		},

		{
			cooldowns: [this.data.actions.GLUTTONY],
			// Delayed Gluttony opener is just before 10th GCD
			firstUseOffset: 22500,
		},
	]
}
