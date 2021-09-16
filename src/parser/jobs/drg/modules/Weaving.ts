import {ActionKey} from 'data/ACTIONS'
import {Weaving as CoreWeaving, Weave} from 'parser/core/modules/Weaving'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const JUMPS: ActionKey[] = [
	'JUMP',
	'HIGH_JUMP',
	'SPINESHATTER_DIVE',
	'DRAGONFIRE_DIVE',
	'STARDIVER',
]

export default class Weaving extends CoreWeaving {
	static override displayOrder = DISPLAY_ORDER.WEAVING

	private jumpIds = JUMPS.map(key => this.data.actions[key].id)

	override getMaxWeaves(weave: Weave) {
		if (weave.weaves.some(weave => this.jumpIds.includes(weave.action))) {
			return 1
		}

		return super.getMaxWeaves(weave)
	}
}
