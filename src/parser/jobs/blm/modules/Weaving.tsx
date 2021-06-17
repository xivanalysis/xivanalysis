import ACTIONS from 'data/ACTIONS'
import {Weave, Weaving as CoreWeaving} from 'parser/core/modules/Weaving'

const OGCD_EXCEPTIONS = [
	ACTIONS.LUCID_DREAMING.id,
	ACTIONS.ADDLE.id,
	ACTIONS.SURECAST.id,
	ACTIONS.TRANSPOSE.id,
]

const OPENER_TIME_THRESHOLD = 10000
const OPENER_EXCEPTIONS = [
	ACTIONS.ENOCHIAN.id,
	ACTIONS.TRIPLECAST.id,
]

export default class BlmWeaving extends CoreWeaving {
	override getMaxWeaves(weave: Weave) {
		const baseMaxWeaves = super.getMaxWeaves(weave)

		return Math.max(this.getAllowedClippingWeaves(weave), baseMaxWeaves)
	}

	private getAllowedClippingWeaves(weave: Weave) {
		if (weave.weaves.some(weave => OGCD_EXCEPTIONS.includes(weave.action))) {
			return 1
		}
		if (weave.weaves.some(weave => OPENER_EXCEPTIONS.includes(weave.action) && weave.timestamp - this.parser.pull.timestamp < OPENER_TIME_THRESHOLD)) {
			return 1
		}
		return 0
	}
}
