import Weaving from 'parser/core/modules/Weaving'
import ACTIONS from 'data/ACTIONS'

const COUNT_AS_ONE = [
	ACTIONS.TEN.id,
	ACTIONS.CHI.id,
	ACTIONS.JIN.id,
	ACTIONS.FUMA_SHURIKEN.id,
	ACTIONS.KATON.id,
	ACTIONS.RAITON.id,
	ACTIONS.HYOTON.id,
	ACTIONS.HUTON.id,
	ACTIONS.DOTON.id,
	ACTIONS.SUITON.id,
	ACTIONS.RABBIT_MEDIUM.id,
	ACTIONS.TEN_CHI_JIN.id,
]


export default class NinWeaving extends Weaving {
	isBadWeave(weave, maxWeaves) {
		let weaveCount = 0, mudraAbilityCounted = false
		for (let i = 0; i < weave.weaves.length; i++) {
			if (COUNT_AS_ONE.includes(weave.weaves[i].ability.guid)) {
				if (!mudraAbilityCounted) {
					weaveCount++
					mudraAbilityCounted = true
				}
			} else {
				weaveCount++
			}
		}

		return weaveCount > 1
	}
}
