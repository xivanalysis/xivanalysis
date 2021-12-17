import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

export class OGCDDowntime extends CooldownDowntime {
	trackedCds = [
		{
			cooldowns: [this.data.actions.INFURIATE],
			// Infuriate is used before the second GCD
			firstUseOffset: 2500,
			resetBy: {
				actions: [
					this.data.actions.FELL_CLEAVE,
					this.data.actions.DECIMATE,
					this.data.actions.CHAOTIC_CYCLONE,
					this.data.actions.INNER_CHAOS,
				],
				refundAmount: 5000,
			},
		},

		{
			cooldowns: [this.data.actions.INNER_RELEASE],
			// IR can sit for up to 5 GCDs, enough to reapply Eye and avoid overcapping gauge
			allowedAverageDowntime: 12500,
			// IR can be delayed in the double IC opener, as late as just before the 6th GCD
			firstUseOffset: 15000,
		},

		{
			cooldowns: [
				this.data.actions.UPHEAVAL,
				this.data.actions.OROGENY,
			],
			// With weaving a defence CD, and getting the CD rolling before IR starts (where you spam Onslaught)
			firstUseOffset: 15000,
		},
	]
}
