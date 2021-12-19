import ACTIONS from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

export default class MultiHitSkills extends AoEUsages {
	suggestionIcon = ACTIONS.SPREAD_SHOT.icon

	trackedActions = [
		{
			aoeAction: ACTIONS.BIOBLASTER,
			stActions: [ACTIONS.DRILL],
			minTargets: 2,
		}, {
			aoeAction: ACTIONS.AUTO_CROSSBOW,
			stActions: [ACTIONS.HEAT_BLAST],
			minTargets: 3,
		}, {
			aoeAction: ACTIONS.SCATTERGUN,
			stActions: [ACTIONS.HEATED_SPLIT_SHOT],
			minTargets: 3,
		},
	]
}
