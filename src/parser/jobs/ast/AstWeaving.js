import Weaving from 'parser/core/modules/Weaving'
import ACTIONS from 'data/ACTIONS'

export default class AstWeaving extends Weaving {
	isBadWeave(weave, maxWeaves) {
		if (weave.gcdEvent.ability) {
			switch (weave.gcdEvent.ability.guid) {
			case ACTIONS.MALEFIC_III.id:
				const weaveCount = weave.weaves.filter(
					event => !this.invuln.isUntargetable('all', event.timestamp)
				).length
				if (weaveCount === 1) {
					return false
				}
				break
			default:
			}
		}

		return super.isBadWeave(weave, maxWeaves)
	}
}
