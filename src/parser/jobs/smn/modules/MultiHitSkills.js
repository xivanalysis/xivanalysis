import ACTIONS from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

export default class MultiHit extends AoEUsages {

	trackedAbilities = [
		{
			aoeAbility: ACTIONS.OUTBURST,
			stAbility: ACTIONS.RUIN_III,
			minTargets: 3,
		},
		{
			aoeAbility: ACTIONS.PAINFLARE,
			stAbility: ACTIONS.FESTER,
			minTargets: 2,
		},
		{
			aoeAbility: ACTIONS.ENERGY_SIPHON,
			stAbility: ACTIONS.ENERGY_DRAIN,
			minTargets: 3,
		},
	]
}
