import ACTIONS from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

export default class MultiHitSkills extends AoEUsages {
	suggestionIcon = ACTIONS.SPREAD_SHOT.icon

	trackedAbilities = [
		{
			aoeAbility: ACTIONS.BIOBLASTER,
			stAbilities: [ACTIONS.DRILL],
			minTargets: 2,
		}, {
			aoeAbility: ACTIONS.AUTO_CROSSBOW,
			stAbilities: [ACTIONS.HEAT_BLAST],
			minTargets: 3,
		}, {
			aoeAbility: ACTIONS.SPREAD_SHOT,
			stAbilities: [
				ACTIONS.HEATED_SPLIT_SHOT,
				ACTIONS.HEATED_SLUG_SHOT,
				ACTIONS.HEATED_CLEAN_SHOT,
			],
			minTargets: 3,
		},
	]
}
