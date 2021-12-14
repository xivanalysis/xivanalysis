import ACTIONS from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

export class AoeChecker extends AoEUsages {
	suggestionIcon = ACTIONS.TRI_DISASTER.icon

	trackedActions = [
		{
			aoeAction: ACTIONS.TRI_DISASTER,
			stActions: [ACTIONS.RUIN_III],
			minTargets: 3,
		},
		{
			aoeAction: ACTIONS.PAINFLARE,
			stActions: [ACTIONS.FESTER],
			minTargets: 3,
		},
		{
			aoeAction: ACTIONS.ENERGY_SIPHON,
			stActions: [ACTIONS.SMN_ENERGY_DRAIN],
			minTargets: 3,
		},
	]
}
