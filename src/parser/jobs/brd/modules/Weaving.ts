/**
 * @author Yumiya
 */
import {ActionKey} from 'data/ACTIONS'
import _ from 'lodash'
import {Weaving as CoreWeaving, Weave} from 'parser/core/modules/Weaving'

const SPECIAL_WEAVE = 3
const ALLOWED_WEAVES: ActionKey[][] = [
	[
		'BLOODLETTER',
		'EMPYREAL_ARROW',
		'BLOODLETTER',
	],
	[
		'PITCH_PERFECT',
		'BLOODLETTER',
		'MAGES_BALLAD',
	],
	[
		'PITCH_PERFECT',
		'MAGES_BALLAD',
		'BLOODLETTER',
	],
	[
		'BLOODLETTER',
		'PITCH_PERFECT',
		'MAGES_BALLAD',
	],
]

export default class Weaving extends CoreWeaving {
	private allowedWeaves = ALLOWED_WEAVES.map(weave => weave.map(key => this.data.actions[key].id))

	override getMaxWeaves(weave: Weave) {
		if (weave.weaves.length === SPECIAL_WEAVE) {
			const weaveSequence = weave.weaves.map(weave => weave.action)

			if (this.allowedWeaves.some((weave) => _.isEqual(weave, weaveSequence))) {
				return SPECIAL_WEAVE
			}
		}

		return super.getMaxWeaves(weave)
	}
}
