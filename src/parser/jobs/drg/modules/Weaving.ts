import {ActionKey} from 'data/ACTIONS'
import {Weaving as CoreWeaving, Weave} from 'parser/core/modules/Weaving'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// With the reduced animation lock, it's just stardiver that's the bad weave
const JUMPS_ALL: ActionKey[] = [
	'STARDIVER',
]

const JUMPS_600: ActionKey[] = [
	'JUMP',
	'HIGH_JUMP',
	'SPINESHATTER_DIVE',
	'DRAGONFIRE_DIVE',
]

export default class Weaving extends CoreWeaving {
	static override displayOrder = DISPLAY_ORDER.WEAVING

	private jumpIds = JUMPS_ALL.map(key => this.data.actions[key].id)

	// pre-6.1, all jumps are bad weaves
	private jump600Ids = [...this.jumpIds, ...JUMPS_600.map(key => this.data.actions[key].id)]

	override getMaxWeaves(weave: Weave) {
		const jumps = this.parser.patch.before('6.1')	? this.jump600Ids : this.jumpIds

		if (weave.weaves.some(weave => jumps.includes(weave.action))) {
			return 1
		}

		return super.getMaxWeaves(weave)
	}
}
