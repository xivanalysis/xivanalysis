import ACTIONS from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

export default class MultiHit extends AoEUsages {
	static dependencies = [
		'gauge',
		//need to include base class dependency or it will not be pulled in
		'suggestions', // eslint-disable-line @xivanalysis/no-unused-dependencies
	]

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

	adjustMinTargets(event /*: AoeEvent*/, minTargets /*: number */) {
		if (event.ability.guid === ACTIONS.PAINFLARE.id && this.gauge.isRushingAetherflow()) {
			return 1
		}
		return minTargets
	}
}
