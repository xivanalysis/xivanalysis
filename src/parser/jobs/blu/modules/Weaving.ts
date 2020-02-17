import ACTIONS from 'data/ACTIONS'
import CoreWeaving, {WeaveInfo} from 'parser/core/modules/Weaving'

const TO_MILLISECONDS = 1000

export default class Weaving extends CoreWeaving {
	isBadWeave(weave: WeaveInfo) {
		let surpanakhas = 0
		weave.weaves.forEach((value) => {
			if (value.ability.guid === ACTIONS.SURPANAKHA.id) {
				surpanakhas++
			}
		})
		if (surpanakhas &&
			weave.weaves.length === surpanakhas &&
			weave.gcdTimeDiff < (surpanakhas + 1) * TO_MILLISECONDS) {
			return false
		}

		return super.isBadWeave(weave)
	}
}
