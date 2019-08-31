import ACTIONS from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

export default class MultiHit extends AoEUsages {

	trackedAbilities = [
		{
			aoeAbility: ACTIONS.OUTBURST,
			stAbilities: [ACTIONS.RUIN_III],
			minTargets: 3,
		},
		{
			aoeAbility: ACTIONS.PAINFLARE,
			stAbilities: [ACTIONS.FESTER],
			minTargets: 2,
		},
		{
			aoeAbility: ACTIONS.ENERGY_SIPHON,
			stAbilities: [ACTIONS.ENERGY_DRAIN],
			minTargets: 3,
		},
	]
}
