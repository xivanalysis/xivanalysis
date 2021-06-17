/**
 * @author Yumiya
 */
import ACTIONS from 'data/ACTIONS'
import _ from 'lodash'
import {Weaving as CoreWeaving, Weave} from 'parser/core/modules/Weaving'

const SPECIAL_WEAVE = 3
const ALLOWED_WEAVES = [
	[
		ACTIONS.BLOODLETTER.id,
		ACTIONS.EMPYREAL_ARROW.id,
		ACTIONS.BLOODLETTER.id,
	],
	[
		ACTIONS.PITCH_PERFECT.id,
		ACTIONS.BLOODLETTER.id,
		ACTIONS.MAGES_BALLAD.id,
	],
	[
		ACTIONS.PITCH_PERFECT.id,
		ACTIONS.MAGES_BALLAD.id,
		ACTIONS.BLOODLETTER.id,
	],
	[
		ACTIONS.BLOODLETTER.id,
		ACTIONS.PITCH_PERFECT.id,
		ACTIONS.MAGES_BALLAD.id,
	],
]

export default class Weaving extends CoreWeaving {
	override getMaxWeaves(weave: Weave) {
		if (weave.weaves.length === SPECIAL_WEAVE) {
			const weaveSequence = weave.weaves.map(weave => weave.action)

			if (ALLOWED_WEAVES.some((weave) => _.isEqual(weave, weaveSequence))) {
				return SPECIAL_WEAVE
			}
		}

		return super.getMaxWeaves(weave)
	}
}
