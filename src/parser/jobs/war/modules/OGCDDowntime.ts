import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

export default class OGCDDowntime extends CooldownDowntime {
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
			// IR can sit for up to 4 GCDs, enough to reapply Eye and avoid overcapping gauge
			allowedAverageDowntime: 10000,
			// IR can be delayed in the double IC opener, as late as just before the 6th GCD
			firstUseOffset: 15000,
		},

		{
			cooldowns: [this.data.actions.UPHEAVAL],
			// With weaving a defence CD, 2nd weavable CD in delayed IR or 3rd in normal (ie before 9th GCD)
			firstUseOffset: 18500,
		},
	]
}
