import {Weaving as CoreWeaving, Weave} from 'parser/core/modules/Weaving'

export default class Weaving extends CoreWeaving {
	override getMaxWeaves(weave: Weave) {
		let dreams = 0

		for (let i = 0; i < weave.weaves.length; i++) {
			if (weave.weaves[i].action === this.data.actions.DREAM_WITHIN_A_DREAM.id) {
				dreams++
			}
		}

		// If duplicate DWaD events are seen, don't penalize the extra events as bad weaves - the data source generated duplicate events that we should ignore
		return super.getMaxWeaves(weave) + Math.min(0, dreams - 1)
	}
}
