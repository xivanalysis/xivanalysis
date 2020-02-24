import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import CoreWeaving, {WeaveInfo} from 'parser/core/modules/Weaving'

const PERMITTED_PHOENIX_WEAVES = 3

export class Weaving extends CoreWeaving {
	isBadWeave(weave: WeaveInfo, maxWeaves?: number) {
		// Permit triple weaves with Firebid Trance because Phoenix will not
		// trigger a Scarlet Flame for the first skill if it is the last weave
		// in a GCD and cannot always be used as the first weave.
		// Only a single extra weave will be allowed and only if it is the middle
		// weave after an instant cast skill.  (If it is the first weave, the triple
		// is not needed. If it is the third weave, the gain from triple weaving
		// does not occur.)
		const hasPhoenixSummon = weave.weaves
			.some(event => event.ability.guid === ACTIONS.FIREBIRD_TRANCE.id)
		if (hasPhoenixSummon && weave.weaves.length === PERMITTED_PHOENIX_WEAVES) {
			// Need to make sure we don't allow a triple weave after a hardcast
			if (!maxWeaves) {
				const gcd = weave.leadingGcdEvent as CastEvent
				if (!gcd || !gcd.ability) {
					maxWeaves = 2
				} else {
					const castTime = this.castTime.forEvent(weave.leadingGcdEvent)
					maxWeaves = castTime === 0 ? 2 : 0
				}
			}

			return weave.weaves.length !== PERMITTED_PHOENIX_WEAVES ||
				weave.weaves[1].ability.guid !== ACTIONS.FIREBIRD_TRANCE.id ||
				maxWeaves !== 2
		}

		return super.isBadWeave(weave, maxWeaves)
	}
}
