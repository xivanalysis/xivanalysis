import ACTIONS from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

export default class MultiHit extends AoEUsages {
	static dependencies = [
		...AoEUsages.dependencies,
		'gauge',
	]

	suggestionIcon = ACTIONS.OUTBURST.icon

	trackedActions = [
		{
			aoeAction: ACTIONS.OUTBURST,
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
			stActions: [ACTIONS.ENERGY_DRAIN],
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
