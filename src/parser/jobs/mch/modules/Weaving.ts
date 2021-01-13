import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import CoreWeaving, {WeaveInfo} from 'parser/core/modules/Weaving'

const HYPERCHARGE_ACTION_IDS = [
	ACTIONS.AUTO_CROSSBOW.id,
	ACTIONS.HEAT_BLAST.id,
]

export default class Weaving extends CoreWeaving {
	isBadWeave(weave: WeaveInfo) {
		const leadingGcd = weave.leadingGcdEvent as CastEvent

		if (leadingGcd && leadingGcd.ability && HYPERCHARGE_ACTION_IDS.includes(leadingGcd.ability.guid)) {
			// Only permit single weaves after heat blast / ACB
			return weave.weaves.length > 1
		}

		return super.isBadWeave(weave)
	}
}
