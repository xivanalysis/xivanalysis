import {Weaving as CoreWeaving, Weave} from 'parser/core/modules/Weaving'

const TO_MILLISECONDS = 1000

export default class Weaving extends CoreWeaving {
	override getMaxWeaves(weave: Weave) {
		let surpanakhas = 0
		weave.weaves.forEach((weave) => {
			if (weave.action === this.data.actions.SURPANAKHA.id) {
				surpanakhas++
			}
		})

		if (surpanakhas &&
			weave.weaves.length === surpanakhas &&
			weave.gcdTimeDiff < (surpanakhas + 1) * TO_MILLISECONDS) {
			return surpanakhas
		}

		return super.getMaxWeaves(weave)
	}
}
