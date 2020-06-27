import ACTIONS from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

export class MultiHitSkills extends AoEUsages {
	suggestionIcon = ACTIONS.QUIETUS.icon

	trackedActions = [
		{
			aoeAction: ACTIONS.FLOOD_OF_SHADOW,
			stActions: [ACTIONS.EDGE_OF_SHADOW],
			minTargets: 2,
		},
		{
			aoeAction: ACTIONS.QUIETUS,
			stActions: [ACTIONS.BLOODSPILLER],
			minTargets: 3,
		},
		{
			aoeAction: ACTIONS.UNLEASH,
			stActions: [ACTIONS.HARD_SLASH, ACTIONS.SYPHON_STRIKE, ACTIONS.SOULEATER],
			minTargets: 2,
		},
		{
			aoeAction: ACTIONS.STALWART_SOUL,
			stActions: [ACTIONS.HARD_SLASH, ACTIONS.SYPHON_STRIKE, ACTIONS.SOULEATER],
			minTargets: 2,
		},
	]
}
