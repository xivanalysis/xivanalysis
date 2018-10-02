/**
 * @author Yumiya
 */
import CoreWeaving from 'parser/core/modules/Weaving'
import ACTIONS from 'data/ACTIONS'
import _ from 'lodash'

const SPECIAL_WEAVE = 3

const BL_EA_BL = [
	ACTIONS.BLOODLETTER.id,
	ACTIONS.EMPYREAL_ARROW.id,
	ACTIONS.BLOODLETTER.id,
]

const BA_PP_EA = [
	ACTIONS.BARRAGE.id,
	ACTIONS.PITCH_PERFECT.id,
	ACTIONS.EMPYREAL_ARROW.id,
]

const BA_EA_PP = [
	ACTIONS.BARRAGE.id,
	ACTIONS.EMPYREAL_ARROW.id,
	ACTIONS.PITCH_PERFECT.id,
]

const PP_BA_EA = [
	ACTIONS.PITCH_PERFECT.id,
	ACTIONS.BARRAGE.id,
	ACTIONS.EMPYREAL_ARROW.id,
]

export default class Weaving extends CoreWeaving {
	isBadWeave(weave) {

		if (weave.weaves.length === SPECIAL_WEAVE) {
			const weaveSequence = weave.weaves.map(w => w.ability.guid)
			if (_.isEqual(weaveSequence, BL_EA_BL) || _.isEqual(weaveSequence, BA_PP_EA) || _.isEqual(weaveSequence, BA_EA_PP) || _.isEqual(weaveSequence, PP_BA_EA)) {
				return false
			}
		}

		return super.isBadWeave(weave)
	}
}
