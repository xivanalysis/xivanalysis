import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import CoreWeaving, {WeaveInfo} from 'parser/core/modules/Weaving'

const SSS_MAX_WEAVES = 4

export default class Weaving extends CoreWeaving {
	isBadWeave(weave: WeaveInfo /*, maxWeaves*/) {
		const gcd = weave.leadingGcdEvent as CastEvent
		if (gcd?.ability && gcd?.ability?.guid === ACTIONS.SIX_SIDED_STAR.id) {
			return weave.weaves.length > SSS_MAX_WEAVES
		}

		return super.isBadWeave(weave)
	}
}
