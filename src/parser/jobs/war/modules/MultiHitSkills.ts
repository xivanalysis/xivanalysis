import ACTIONS from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

export default class MultiHitSkills extends AoEUsages {
	suggestionIcon = ACTIONS.CRIMSON_CYCLONE.icon

	trackedActions = [
		{
			aoeAction: ACTIONS.CRIMSON_CYCLONE,
			stActions: [ACTIONS.INNER_CHAOS],
			minTargets: 3,
		}, {
			aoeAction: ACTIONS.DECIMATE,
			stActions: [ACTIONS.FELL_CLEAVE],
			minTargets: 3,
		}, {
			aoeAction: ACTIONS.OVERPOWER,
			stActions: [ACTIONS.HEAVY_SWING, ACTIONS.MAIM, ACTIONS.STORMS_EYE, ACTIONS.STORMS_PATH],
			minTargets: 2,
		}, {
			aoeAction: ACTIONS.MYTHRIL_TEMPEST,
			stActions: [ACTIONS.HEAVY_SWING, ACTIONS.MAIM, ACTIONS.STORMS_EYE, ACTIONS.STORMS_PATH],
			minTargets: 2,
		},
	]
}