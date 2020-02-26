import CoreWeaving from 'parser/core/modules/Weaving'
import ACTIONS from 'data/ACTIONS'

export default class Weaving extends CoreWeaving {
	isBadWeave(weave/*, maxWeaves*/) {
		let dreams = 0

		for (let i = 0; i < weave.weaves.length; i++) {
			if (weave.weaves[i].ability.guid === ACTIONS.DREAM_WITHIN_A_DREAM.id) {
				dreams++
			}
		}

		if (dreams > 1) {
			// We had duplicate DWaD events; only one is actually valid, so remove dreams - 1 from the count to dedupe and test that
			return (weave.weaves.length - (dreams - 1)) > 2
		}

		return super.isBadWeave(weave, 2)
	}
}
