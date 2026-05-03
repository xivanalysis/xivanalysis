import {Weaving as CoreWeaving, Weave} from 'parser/core/modules/AlwaysBeCasting/Weaving'

export class Weaving extends CoreWeaving {
	override getMaxWeaves(weave: Weave) {
		let adjustment = 0
		if (weave.leadingGcdEvent.action === this.data.actions.UNCOILED_FURY.id) {
			adjustment = 1
		}

		return super.getMaxWeaves(weave) + adjustment
	}
}
