import {ActionRoot} from 'data/ACTIONS/root'
import {CastEvent} from 'fflogs'
import CoreWeaving, {WeaveInfo} from 'parser/core/modules/Weaving'

const HYPERCHARGE_ACTION_IDS: Array<keyof ActionRoot> = [
	'AUTO_CROSSBOW',
	'HEAT_BLAST',
]

export default class Weaving extends CoreWeaving {
	private HYPERCHARGE_ACTION_IDS: number[] = []

	protected override init() {
		super.init()
		this.HYPERCHARGE_ACTION_IDS = HYPERCHARGE_ACTION_IDS.map(actionKey => this.data.actions[actionKey].id)
	}

	override isBadWeave(weave: WeaveInfo) {
		const leadingGcd = weave.leadingGcdEvent as CastEvent

		if (leadingGcd && leadingGcd.ability && this.HYPERCHARGE_ACTION_IDS.includes(leadingGcd.ability.guid)) {
			// Only permit single weaves after heat blast / ACB
			return weave.weaves.length > 1
		}

		return super.isBadWeave(weave)
	}
}
