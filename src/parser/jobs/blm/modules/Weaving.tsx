import {ActionKey} from 'data/ACTIONS'
import {Weave, Weaving as CoreWeaving} from 'parser/core/modules/Weaving'

const OGCD_EXCEPTIONS: ActionKey[] = [
	'LUCID_DREAMING',
	'ADDLE',
	'SURECAST',
	'TRANSPOSE',
]

const OPENER_TIME_THRESHOLD = 10000
const OPENER_EXCEPTIONS: ActionKey[] = [
	'ENOCHIAN',
	'TRIPLECAST',
]

export default class BlmWeaving extends CoreWeaving {
	private ogcdIds = OGCD_EXCEPTIONS.map(key => this.data.actions[key].id)
	private openerIds = OPENER_EXCEPTIONS.map(key => this.data.actions[key].id)

	override getMaxWeaves(weave: Weave) {
		const baseMaxWeaves = super.getMaxWeaves(weave)

		return Math.max(this.getAllowedClippingWeaves(weave), baseMaxWeaves)
	}

	private getAllowedClippingWeaves(weave: Weave) {
		if (weave.weaves.some(weave => this.ogcdIds.includes(weave.action))) {
			return 1
		}
		if (
			weave.weaves.some(weave => this.openerIds.includes(weave.action)
			&& weave.timestamp - this.parser.pull.timestamp < OPENER_TIME_THRESHOLD)
		) {
			return 1
		}
		return 0
	}
}
