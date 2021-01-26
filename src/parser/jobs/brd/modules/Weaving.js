/**
 * @author Yumiya
 */
import ACTIONS from 'data/ACTIONS'
import _ from 'lodash'
import CoreWeaving from 'parser/core/modules/Weaving'

const SPECIAL_WEAVE = 3
const ALLOWED_WEAVES = [
	[
		ACTIONS.BLOODLETTER.id,
		ACTIONS.EMPYREAL_ARROW.id,
		ACTIONS.BLOODLETTER.id,
	],
	[
		ACTIONS.BARRAGE.id,
		ACTIONS.PITCH_PERFECT.id,
		ACTIONS.EMPYREAL_ARROW.id,
	],
	[
		ACTIONS.BARRAGE.id,
		ACTIONS.EMPYREAL_ARROW.id,
		ACTIONS.PITCH_PERFECT.id,
	],
	[
		ACTIONS.PITCH_PERFECT.id,
		ACTIONS.BARRAGE.id,
		ACTIONS.EMPYREAL_ARROW.id,
	],
]

export default class Weaving extends CoreWeaving {
	isBadWeave(weave) {

		if (weave.weaves.length === SPECIAL_WEAVE) {
			const weaveSequence = weave.weaves.map(w => w.ability.guid)

			return !ALLOWED_WEAVES.some((weave) => _.isEqual(weave, weaveSequence))
		}

		return super.isBadWeave(weave)
	}
}
