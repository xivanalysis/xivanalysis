import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'


export default class OGCDDowntime extends CooldownDowntime {
	trackedCds = [
		{
			cooldowns: [ACTIONS.INFURIATE],
			// Infuriate is used before the second GCD
			firstUseOffset: 2500,
			resetBy: {
				actions: [
					ACTIONS.FELL_CLEAVE,
					ACTIONS.DECIMATE,
					ACTIONS.CHAOTIC_CYCLONE,
					ACTIONS.INNER_CHAOS,
				],
				refundAmount: 5000,
			},
		},

		{
			cooldowns: [ACTIONS.INNER_RELEASE],
			// IR can sit for up to 4 GCDs, enough to reapply Eye and avoid overcapping gauge
			allowedAverageDowntime: 10000,
			// IR can be delayed in the double IC opener, as late as just before the 6th GCD
			firstUseOffset: 15000,
		},

		{
			cooldowns: [ACTIONS.UPHEAVAL],
			// With weaving a defence CD, 2nd weavable CD in delayed IR or 3rd in normal (ie before 9th GCD)
			firstUseOffset: 18500,
		},
	]
}
