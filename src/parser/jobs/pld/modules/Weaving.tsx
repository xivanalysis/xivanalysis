import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import CoreWeaving, {WeaveInfo} from 'parser/core/modules/Weaving'

const SPELLS = [
	ACTIONS.HOLY_SPIRIT.id,
	ACTIONS.HOLY_CIRCLE.id,
	ACTIONS.CONFITEOR.id,
	ACTIONS.CLEMENCY.id,
]

export default class Weaving extends CoreWeaving {

	@dependency private combatants!: Combatants

	override isBadWeave(weave: WeaveInfo /*, maxWeaves*/) {
		// Check for if the homie opened on an oGCD for w/e reason
		if (weave.leadingGcdEvent.type != null && weave.leadingGcdEvent.ability != null) {
			// Requiescat makes spells instant cast, so they get 2 weaves by default.
			if (this.combatants.selected.hasStatus(STATUSES.REQUIESCAT.id)
				&& SPELLS.includes(weave.leadingGcdEvent.ability.guid)) {
				return weave.weaves.length > 2
			}
		}

		return super.isBadWeave(weave)
	}
}
