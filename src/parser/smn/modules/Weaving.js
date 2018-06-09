import ACTIONS from 'data/ACTIONS'
import BaseWeaving from 'parser/core/modules/Weaving'

class Weaving extends BaseWeaving {
	isBadWeave(weave) {
		if (
			weave.gcdEvent.ability &&
			weave.gcdEvent.ability.guid === ACTIONS.RUIN_III.id
		) {
			// TODO: This should only run during DWT
			return super.isBadWeave(weave, 2)
		}

		return super.isBadWeave(weave)
	}
}

console.log(Weaving.dependencies)

export default Weaving
