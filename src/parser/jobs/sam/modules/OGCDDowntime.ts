import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import DISPLAY_ORDER from './DISPLAY_ORDER'

//All Offsets based on this opener: https://cdn.discordapp.com/attachments/920171773012627516/920936501905350676/sam_ew_opener.png

//2500 + 2180x where x is the GCD in minus 1 for offset

// Senei/Guren is used after 5th gcd
const FIRSTUSEOFFSET_50KENKI = 13400
// tsubame is at the 5th GCD mark
const FIRSTUSEOFFSET_TSUBAME = 13400
//Ikishoten is actually not used off the bat, since a pot is used ogcd 1
const FIRSTUSEOFFSET_IKIS = 2500
// Time that samurais have deemed ok for a OGCD to be down
const DEFAULT_ALLOWED_DOWNTIME = 2180
const MEIKYO_ALLOWED_DOWNTIME = 4360

export default class OGCDDowntime extends CooldownDowntime {
	override defaultAllowedAverageDowntime = DEFAULT_ALLOWED_DOWNTIME
	displayOrder = DISPLAY_ORDER.COOLDOWNS
	override trackedCds = [
		{
			cooldowns: [this.data.actions.MEIKYO_SHISUI],
			allowedAverageDowntime: MEIKYO_ALLOWED_DOWNTIME,
		},
		{
			cooldowns: [
				this.data.actions.KAESHI_SETSUGEKKA,
				this.data.actions.KAESHI_GOKEN,
				this.data.actions.KAESHI_HIGANBANA,
			],
			firstUseOffset: FIRSTUSEOFFSET_TSUBAME,
		},
		{
			cooldowns: [
				this.data.actions.HISSATSU_GUREN,
				this.data.actions.HISSATSU_SENEI,
			],
			firstUseOffset: FIRSTUSEOFFSET_50KENKI,
		},
		{
			cooldowns: [this.data.actions.IKISHOTEN],
			firstUseOffset: FIRSTUSEOFFSET_IKIS,
		},
	]
}
