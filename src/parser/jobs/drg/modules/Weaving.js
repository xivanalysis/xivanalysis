import CoreWeaving from 'parser/core/modules/Weaving'
import ACTIONS from 'data/ACTIONS'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const JUMPS = [
	ACTIONS.JUMP.id,
	ACTIONS.HIGH_JUMP.id,
	ACTIONS.SPINESHATTER_DIVE.id,
	ACTIONS.DRAGONFIRE_DIVE.id,
	ACTIONS.STARDIVER.id,
]

export default class Weaving extends CoreWeaving {
	static displayOrder = DISPLAY_ORDER.WEAVING
	isBadWeave(weave/*, maxWeaves*/) {
		for (let i = 0; i < weave.weaves.length; i++) {
			if (JUMPS.includes(weave.weaves[i].ability.guid)) {
				// Jumps should only ever be single-woven; everything else follows the normal rules
				return weave.weaves.length > 1
			}
		}
		return super.isBadWeave(weave)
	}
}
