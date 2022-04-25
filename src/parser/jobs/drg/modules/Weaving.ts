import {ActionKey} from 'data/ACTIONS'
import {Weaving as CoreWeaving, Weave} from 'parser/core/modules/Weaving'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// With the reduced animation lock, it's just stardiver that's the bad weave
const JUMPS: ActionKey[] = [
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

	private jumps = JUMPS.map(key => this.data.actions[key].id)

	override getMaxWeaves(weave: Weave) {
		if (this.parser.patch.before('6.1')) {
			this.jumps.push(...JUMPS_600.map(key => this.data.actions[key].id))
		}

		if (weave.weaves.some(weave => this.jumps.includes(weave.action))) {
			return 1
		}

		return super.getMaxWeaves(weave)
	}
}
