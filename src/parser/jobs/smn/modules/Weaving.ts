import ACTIONS from 'data/ACTIONS'
import CoreWeaving, {WeaveInfo} from 'parser/core/modules/Weaving'

const PERMITTED_PHOENIX_WEAVES = 3

export class Weaving extends CoreWeaving {
	isBadWeave(weave: WeaveInfo, maxWeaves?: number) {
		// Permit triple weaves with Firbid Trance because jank
		const hasPhoenixSummon = weave.weaves
			.some(event => event.ability.guid === ACTIONS.FIREBIRD_TRANCE.id)
		if (hasPhoenixSummon) {
			return super.isBadWeave(weave, PERMITTED_PHOENIX_WEAVES)
		}

		return super.isBadWeave(weave, maxWeaves)
	}
}
