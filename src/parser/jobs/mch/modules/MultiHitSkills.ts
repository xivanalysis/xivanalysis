import ACTIONS from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

export default class MultiHitSkills extends AoEUsages {
	suggestionIcon = ACTIONS.SPREAD_SHOT.icon

	trackedActions = [
		{
			AoEAction: ACTIONS.BIOBLASTER,
			stActions: [ACTIONS.DRILL],
			minTargets: 2,
		}, {
			AoEAction: ACTIONS.AUTO_CROSSBOW,
			stActions: [ACTIONS.HEAT_BLAST],
			minTargets: 3,
		}, {
			AoEAction: ACTIONS.SPREAD_SHOT,
			stActions: [
				ACTIONS.HEATED_SPLIT_SHOT,
				ACTIONS.HEATED_SLUG_SHOT,
				ACTIONS.HEATED_CLEAN_SHOT,
			],
			minTargets: 3,
		},
	]
}
