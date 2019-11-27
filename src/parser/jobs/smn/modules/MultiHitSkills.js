import ACTIONS from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

export default class MultiHit extends AoEUsages {
	static dependencies = [
		...AoEUsages.dependencies,
		'gauge',
	]

	suggestionIcon = ACTIONS.OUTBURST.icon

	trackedAbilities = [
		{
			aoeAbility: ACTIONS.OUTBURST,
			stAbilities: [ACTIONS.RUIN_III],
			minTargets: 3,
		},
		{
			aoeAbility: ACTIONS.PAINFLARE,
			stAbilities: [ACTIONS.FESTER],
			minTargets: 3,
		},
		{
			aoeAbility: ACTIONS.ENERGY_SIPHON,
			stAbilities: [ACTIONS.ENERGY_DRAIN],
			minTargets: 3,
		},
	]

	adjustMinTargets(event /*: AoeEvent*/, minTargets /*: number */) {
		if (event.ability.guid === ACTIONS.PAINFLARE.id && this.gauge.isRushingAetherflow()) {
			return 1
		}
		return minTargets
	}
}
