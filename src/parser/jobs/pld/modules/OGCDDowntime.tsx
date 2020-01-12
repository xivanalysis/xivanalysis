import ACTIONS from 'data/ACTIONS'
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

export default class OGCDDowntime extends CooldownDowntime {
	static debug = false
	trackedCds = [
		{
			cooldowns: [ACTIONS.FIGHT_OR_FLIGHT],
			allowedAverageDowntime: ALLOWED_DOWNTIME_FOF,
			firstUseOffset: FIRST_USE_OFFSET_FOF,
		},
		{
			cooldowns: [ACTIONS.REQUIESCAT],
			allowedAverageDowntime: ALLOWED_DOWNTIME_REQ,
			firstUseOffset: FIRST_USE_OFFSET_REQ,
		},
		{cooldowns: [ACTIONS.SPIRITS_WITHIN]},
		{cooldowns: [ACTIONS.CIRCLE_OF_SCORN]},
		{
			cooldowns: [ACTIONS.INTERVENE],
			firstUseOffset: 15000,
		},
	]
}
