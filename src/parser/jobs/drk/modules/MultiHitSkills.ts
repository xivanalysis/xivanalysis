import ACTIONS from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

export class MultiHitSkills extends AoEUsages {
	suggestionIcon = ACTIONS.QUIETUS.icon

	trackedAbilities = [
		{
			aoeAbility: ACTIONS.FLOOD_OF_SHADOW,
			stAbilities: [ACTIONS.EDGE_OF_SHADOW],
			minTargets: 2,
		},
		{
			aoeAbility: ACTIONS.QUIETUS,
			stAbilities: [ACTIONS.BLOODSPILLER],
			minTargets: 3,
		},
		{
			aoeAbility: ACTIONS.UNLEASH,
			stAbilities: [ACTIONS.HARD_SLASH, ACTIONS.SYPHON_STRIKE, ACTIONS.SOULEATER],
			minTargets: 2,
		},
		{
			aoeAbility: ACTIONS.STALWART_SOUL,
			stAbilities: [ACTIONS.HARD_SLASH, ACTIONS.SYPHON_STRIKE, ACTIONS.SOULEATER],
			minTargets: 2,
		},
	]
}
