import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

// meikyo is used after the 7th gcd
const FIRSTUSEOFFSET_MEIKYO = 17500
// tsubame is used after the first midare, on the 11th GCD
const FIRSTUSEOFFSET_TSUBAME = 27500
// Time that samurais have deemed ok for a OGCD to be down
const DEFAULT_ALLOWED_DOWNTIME = 2500

export default class OGCDDowntime extends CooldownDowntime {
	defaultAllowedAverageDowntime = DEFAULT_ALLOWED_DOWNTIME
	trackedCds = [
		{
			cooldowns: [ACTIONS.MEIKYO_SHISUI],
			firstUseOffset: FIRSTUSEOFFSET_MEIKYO,
		},
		{
			cooldowns: [
				ACTIONS.KAESHI_SETSUGEKKA,
				ACTIONS.KAESHI_GOKEN,
				ACTIONS.KAESHI_HIGANBANA,
			],
			firstUseOffset: FIRSTUSEOFFSET_TSUBAME,
		},
	]
}
