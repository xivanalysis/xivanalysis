import ACTIONS from 'data/ACTIONS'
import CoreWeaving from 'parser/core/modules/Weaving'

const SSS_MAX_WEAVES = 4

export default class Weaving extends CoreWeaving {
	isBadWeave(weave: TODO /*, maxWeaves*/) {
		if (weave.leadingGcdEvent &&
			weave.leadingGcdEvent.ability &&
			weave.leadingGcdEvent.ability.guid === ACTIONS.SIX_SIDED_STAR.id) {
				return weave.weaves.length > SSS_MAX_WEAVES
			}

		return super.isBadWeave(weave)
	}
}
