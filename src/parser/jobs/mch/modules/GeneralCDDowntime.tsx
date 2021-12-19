import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

// Strict downtime allowance for drill/bio blaster/air anchor
const DOWNTIME_ALLOWED_GCD = 100

export default class GeneralCDDowntime extends CooldownDowntime {
	trackedCds = [{
		cooldowns: [this.data.actions.WILDFIRE],
		firstUseOffset: 10000,
	}, {
		cooldowns: [this.data.actions.BARREL_STABILIZER],
		firstUseOffset: 3000,
	}, {
		cooldowns: [this.data.actions.REASSEMBLE],
		allowedAverageDowntime: 5000,
		firstUseOffset: -3000,
	}, {
		cooldowns: [this.data.actions.AIR_ANCHOR],
		allowedAverageDowntime: DOWNTIME_ALLOWED_GCD,
		firstUseOffset: 0,
		// Currently, this property is not used due to the low reliability of GCD estimates.
		// isAffectedBySpeed: true,
	}, {
		cooldowns: [
			this.data.actions.DRILL,
			this.data.actions.BIOBLASTER,
		],
		allowedAverageDowntime: DOWNTIME_ALLOWED_GCD,
		firstUseOffset: 2500,
		// isAffectedBySpeed: true,
	}, {
		cooldowns: [this.data.actions.CHAIN_SAW],
		allowedAverageDowntime: DOWNTIME_ALLOWED_GCD,
		firstUseOffset: 12500,
		// isAffectedBySpeed: true,
	}, {
		cooldowns: [this.data.actions.GAUSS_ROUND],
		firstUseOffset: 3000,
		resetBy: {actions: [this.data.actions.HEAT_BLAST], refundAmount: 15000},
	}, {
		cooldowns: [this.data.actions.RICOCHET],
		firstUseOffset: 3000,
		resetBy: {actions: [this.data.actions.HEAT_BLAST], refundAmount: 15000},
	}]
}
