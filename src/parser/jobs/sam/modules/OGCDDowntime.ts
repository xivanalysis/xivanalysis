import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

// GCD timing: 2.5 seconds for first two GCDs (to get Shifu up), 2.18 seconds for all others.
// meikyo is used after the 7th gcd
const FIRSTUSEOFFSET_MEIKYO = 15900
// Senei/Guren is used after 6th gcd
const FIRSTUSEOFFSET_50KENKI = 13720
// tsubame is used after the first midare, on the 11th GCD
const FIRSTUSEOFFSET_TSUBAME = 24620
// Time that samurais have deemed ok for a OGCD to be down
const DEFAULT_ALLOWED_DOWNTIME = 2180
const MEIKYO_ALLOWED_DOWNTIME = 4360

export default class OGCDDowntime extends CooldownDowntime {
	defaultAllowedAverageDowntime = DEFAULT_ALLOWED_DOWNTIME
	trackedCds = [
		{
			cooldowns: [ACTIONS.MEIKYO_SHISUI],
			firstUseOffset: FIRSTUSEOFFSET_MEIKYO,
			allowedAverageDowntime: MEIKYO_ALLOWED_DOWNTIME,
		},
		{
			cooldowns: [
				ACTIONS.KAESHI_SETSUGEKKA,
				ACTIONS.KAESHI_GOKEN,
				ACTIONS.KAESHI_HIGANBANA,
			],
			firstUseOffset: FIRSTUSEOFFSET_TSUBAME,
		},
		{
			cooldowns: [
				ACTIONS.HISSATSU_GUREN,
				ACTIONS.HISSATSU_SENEI,
			],
			firstUseOffset: FIRSTUSEOFFSET_50KENKI,
		},
		{
			cooldowns: [ACTIONS.IKISHOTEN],
		},

	]
}
