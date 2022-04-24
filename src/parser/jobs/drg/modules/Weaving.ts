import {ActionKey} from 'data/ACTIONS'
import {Weaving as CoreWeaving, Weave} from 'parser/core/modules/Weaving'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// With the reduced animation lock, it's just stardiver that's the bad weave
const JUMPS: ActionKey[] = [
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
