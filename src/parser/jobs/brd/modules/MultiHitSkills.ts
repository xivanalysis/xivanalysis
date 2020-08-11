import ACTIONS from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

export default class MultiHitSkills extends AoEUsages {
	suggestionIcon = ACTIONS.QUICK_NOCK.icon

	trackedActions = [
		{
			aoeAction: ACTIONS.QUICK_NOCK,
			stActions: [ACTIONS.BURST_SHOT],
			minTargets: 2,
		}, {
			aoeAction: ACTIONS.RAIN_OF_DEATH,
			stActions: [ACTIONS.BLOODLETTER],
			minTargets: 2,
		}, {
			aoeAction: ACTIONS.SHADOWBITE,
			stActions: [ACTIONS.SIDEWINDER],
			minTargets: 2,
		},
	]
}
