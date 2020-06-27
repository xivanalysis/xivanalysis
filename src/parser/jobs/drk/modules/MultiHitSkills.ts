import ACTIONS from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

export class MultiHitSkills extends AoEUsages {
	suggestionIcon = ACTIONS.QUIETUS.icon

	trackedActions = [
		{
			AoEAction: ACTIONS.FLOOD_OF_SHADOW,
			stActions: [ACTIONS.EDGE_OF_SHADOW],
			minTargets: 2,
		},
		{
			AoEAction: ACTIONS.QUIETUS,
			stActions: [ACTIONS.BLOODSPILLER],
			minTargets: 3,
		},
		{
			AoEAction: ACTIONS.UNLEASH,
			stActions: [ACTIONS.HARD_SLASH, ACTIONS.SYPHON_STRIKE, ACTIONS.SOULEATER],
			minTargets: 2,
		},
		{
			AoEAction: ACTIONS.STALWART_SOUL,
			stActions: [ACTIONS.HARD_SLASH, ACTIONS.SYPHON_STRIKE, ACTIONS.SOULEATER],
			minTargets: 2,
		},
	]
}
