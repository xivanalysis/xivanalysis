import ACTIONS from 'data/ACTIONS'
import {Weaving as CoreWeaving, Weave} from 'parser/core/modules/Weaving'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const JUMPS = [
	ACTIONS.JUMP.id,
	ACTIONS.HIGH_JUMP.id,
	ACTIONS.SPINESHATTER_DIVE.id,
	ACTIONS.DRAGONFIRE_DIVE.id,
	ACTIONS.STARDIVER.id,
]

export default class Weaving extends CoreWeaving {
	static override displayOrder = DISPLAY_ORDER.WEAVING

	override getMaxWeaves(weave: Weave) {
		if (weave.weaves.some(weave => JUMPS.includes(weave.action))) {
			return 1
		}

		return super.getMaxWeaves(weave)
	}
}
