import {ActionRoot} from 'data/ACTIONS/root'
import {CastEvent} from 'fflogs'
import CoreWeaving, {WeaveInfo} from 'parser/core/modules/Weaving'
import DISPLAY_ORDER from '../DISPLAY_ORDER'

const FINISH_IDS: Array<keyof ActionRoot> = [
	'SINGLE_STANDARD_FINISH',
	'DOUBLE_STANDARD_FINISH',
	'SINGLE_TECHNICAL_FINISH',
	'DOUBLE_TECHNICAL_FINISH',
	'TRIPLE_TECHNICAL_FINISH',
	'QUADRUPLE_TECHNICAL_FINISH',
]

export default class Weaving extends CoreWeaving {
	static override displayOrder = DISPLAY_ORDER.WEAVING
	private FINISH_IDS: number[] = []

	protected override init() {
		super.init()
		this.FINISH_IDS = FINISH_IDS.map(actionKey => this.data.actions[actionKey].id)
	}

	override isBadWeave(weave: WeaveInfo) {
		const leadingGcd = weave.leadingGcdEvent as CastEvent

		if (leadingGcd && leadingGcd.ability && this.FINISH_IDS.includes(leadingGcd.ability.guid)) {
			// Only permit single weaves after a dance finish
			return weave.weaves.length > 1
		}

		return super.isBadWeave(weave)
	}
}
