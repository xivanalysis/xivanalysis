import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

// Allowed downtime set to 4s to account for PLD's natural rotation drift.
const ALLOWED_DOWNTIME_FOF = 4000
const ALLOWED_DOWNTIME_REQ = 4000

/* These first use offsets are large to allow for both Requiescat-first and
 * Fight or Flight-first openers --- the former delays Fight or Flight to
 * 23-24s, and the latter delays Requiescat to 30-31s, depending on whether
 * or not a holy spirit was used on pull.
 */
const FIRST_USE_OFFSET_FOF = 24000
const FIRST_USE_OFFSET_REQ = 31000

export class OGCDDowntime extends CooldownDowntime {
	static override debug = false
	trackedCds = [
		{
			cooldowns: [this.data.actions.FIGHT_OR_FLIGHT],
			allowedAverageDowntime: ALLOWED_DOWNTIME_FOF,
			firstUseOffset: FIRST_USE_OFFSET_FOF,
		},
		{
			cooldowns: [this.data.actions.REQUIESCAT],
			allowedAverageDowntime: ALLOWED_DOWNTIME_REQ,
			firstUseOffset: FIRST_USE_OFFSET_REQ,
		},
		{cooldowns: [this.data.actions.SPIRITS_WITHIN]},
		{cooldowns: [this.data.actions.CIRCLE_OF_SCORN]},
		{
			cooldowns: [this.data.actions.INTERVENE],
			firstUseOffset: 15000,
		},
	]
}
