import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

/**
 * The default allowance for dances is too lenient since in practice
 * they're just GCDs and drifting them is heavily discouraged.
 * 250 ms should be enough to forgive light clipping.
 */
const ALLOWED_DANCE_DOWNTIME = 250

export default class OGCDDowntime extends CooldownDowntime {
	trackedCds = [
		{
			cooldowns: [this.data.actions.TECHNICAL_STEP],
			allowedAverageDowntime: ALLOWED_DANCE_DOWNTIME,
		},
		{
			cooldowns: [this.data.actions.STANDARD_STEP],
			firstUseOffset: -15000,
			allowedAverageDowntime: ALLOWED_DANCE_DOWNTIME,
		},
		{cooldowns: [this.data.actions.DEVILMENT]},
		{cooldowns: [this.data.actions.FLOURISH]},
	]
}
