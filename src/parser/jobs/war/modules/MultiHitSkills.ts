import ACTIONS from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

export default class MultiHitSkills extends AoEUsages {
	suggestionIcon = ACTIONS.OVERPOWER.icon

	trackedActions = [
		{
			aoeAction: ACTIONS.CHAOTIC_CYCLONE,
			stActions: [ACTIONS.INNER_CHAOS],
			minTargets: 3,
		}, {
			aoeAction: ACTIONS.DECIMATE,
			stActions: [ACTIONS.FELL_CLEAVE],
			minTargets: 3,
		}, {
			aoeAction: ACTIONS.OVERPOWER,
			stActions: [ACTIONS.HEAVY_SWING],
			minTargets: 2,
		},
	]
}
