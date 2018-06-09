import ACTIONS from 'data/ACTIONS'
import BaseWeaving from 'parser/core/modules/Weaving'

class Weaving extends BaseWeaving {
	isBadWeave(weave) {
		const gcd = weave.gcdEvent
		if (
			gcd.ability &&
			gcd.ability.guid === ACTIONS.RUIN_III.id &&
			this.dwt.activeAt(gcd.timestamp)
		) {
			return super.isBadWeave(weave, 2)
		}

		return super.isBadWeave(weave)
	}
}

// We need an extra dep
Weaving.dependencies.push('dwt')

export default Weaving
