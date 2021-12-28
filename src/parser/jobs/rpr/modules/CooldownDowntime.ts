import {CooldownDowntime as CoreCooldownDowntime} from 'parser/core/modules/CooldownDowntime'

export class CooldownDowntime extends CoreCooldownDowntime {
	trackedCds = [
		{
			cooldowns: [this.data.actions.ARCANE_CIRCLE],
			// JP opener is after 2nd GCD
			firstUseOffset: 5000,
		},

		{
			cooldowns: [this.data.actions.SOUL_SLICE,
				this.data.actions.SOUL_SCYTHE],
			// Both openers use this as 2nd GCD
			firstUseOffset: 4000,
		},

		{
			cooldowns: [this.data.actions.GLUTTONY],
			// Delayed Gluttony opener is just before 10th GCD
			firstUseOffset: 22500,
		},
	]
}
