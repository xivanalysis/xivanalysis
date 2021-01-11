import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import CoreWeaving, {WeaveInfo} from 'parser/core/modules/Weaving'
import DISPLAY_ORDER from '../DISPLAY_ORDER'

const FINISH_IDS = [
	ACTIONS.SINGLE_STANDARD_FINISH.id,
	ACTIONS.DOUBLE_STANDARD_FINISH.id,
	ACTIONS.SINGLE_TECHNICAL_FINISH.id,
	ACTIONS.DOUBLE_TECHNICAL_FINISH.id,
	ACTIONS.TRIPLE_TECHNICAL_FINISH.id,
	ACTIONS.QUADRUPLE_TECHNICAL_FINISH.id,
]

export default class Weaving extends CoreWeaving {
	static displayOrder = DISPLAY_ORDER.WEAVING

	isBadWeave(weave: WeaveInfo) {
		const leadingGcd = weave.leadingGcdEvent as CastEvent

		if (leadingGcd && leadingGcd.ability && FINISH_IDS.includes(leadingGcd.ability.guid)) {
			// Only permit single weaves after a dance finish
			return weave.weaves.length > 1
		}

		return super.isBadWeave(weave)
	}
}
