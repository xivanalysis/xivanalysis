import {Weaving as CoreWeaving, Weave} from 'parser/core/modules/Weaving'

const SSS_MAX_WEAVES = 4

export default class Weaving extends CoreWeaving {
	override getMaxWeaves(weave: Weave) {
		if (weave.leadingGcdEvent?.action === this.data.actions.SIX_SIDED_STAR.id) {
			return SSS_MAX_WEAVES
		}

		return super.getMaxWeaves(weave)
	}
}
