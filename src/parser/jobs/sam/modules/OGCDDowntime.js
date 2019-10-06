import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'
//meikyo is used after the 7th gcd
const FIRSTUSEOFFSETMEIKYO = 17500
//tsubame is used after the first midare, on the 11th GCD
const FIRSTUSEOFFSETTSUBAME = 27500
export default class OGCDDowntime extends CooldownDowntime {
	//Time that samurais have deemed ok for a OGCD to be down
	// eslint-disable-next-line no-magic-numbers
	allowedDowntime = 5000
	trackedCds = [
		ACTIONS.MEIKYO_SHISUI.id,
		ACTIONS.KAESHI_SETSUGEKKA.id,
		ACTIONS.KAESHI_GOKEN.id,
		ACTIONS.KAESHI_HIGANBANA.id,
	]

	firstUseOffsetPerOgcd = {
		[ACTIONS.MEIKYO_SHISUI.id]: FIRSTUSEOFFSETMEIKYO,
		[ACTIONS.KAESHI_SETSUGEKKA.id]: FIRSTUSEOFFSETTSUBAME,
		[ACTIONS.KAESHI_GOKEN.id]: FIRSTUSEOFFSETTSUBAME,
		[ACTIONS.KAESHI_HIGANBANA.id]: FIRSTUSEOFFSETTSUBAME,
	}

}
