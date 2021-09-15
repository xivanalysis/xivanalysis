import {Weaving as CoreWeaving, Weave} from 'parser/core/modules/Weaving'

const PERMITTED_PHOENIX_WEAVES = 3

export class Weaving extends CoreWeaving {
	override getMaxWeaves(weave: Weave) {
		// Permit triple weaves with Firebid Trance because Phoenix will not
		// trigger a Scarlet Flame for the first skill if it is the last weave
		// in a GCD and cannot always be used as the first weave.
		// Only a single extra weave will be allowed and only if it is the middle
		// weave after an instant cast skill.  (If it is the first weave, the triple
		// is not needed. If it is the third weave, the gain from triple weaving
		// does not occur.)

		const hasPhoenixSummon = weave.weaves.some(weave => weave.action === this.data.actions.FIREBIRD_TRANCE.id)

		if (!hasPhoenixSummon || weave.leadingGcdEvent == null) {
			return super.getMaxWeaves(weave)
		}

		const leadingGcdCastTime = this.castTime.forEvent(weave.leadingGcdEvent)
		if (leadingGcdCastTime === 0 && weave.weaves[1]?.action === this.data.actions.FIREBIRD_TRANCE.id) {
			return PERMITTED_PHOENIX_WEAVES
		}

		return super.getMaxWeaves(weave)
	}
}
