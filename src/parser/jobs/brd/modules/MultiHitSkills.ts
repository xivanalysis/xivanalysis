import ACTIONS from 'data/ACTIONS'
import {AoEUsages} from 'parser/core/modules/AoEUsages'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class MultiHitSkills extends AoEUsages {
	static displayerOrder = DISPLAY_ORDER.MULTI_HIT_SKILLS
	suggestionIcon = ACTIONS.LADONSBITE.icon

	trackedActions = [
		{
			aoeAction: ACTIONS.QUICK_NOCK,
			stActions: [ACTIONS.BURST_SHOT],
			minTargets: 2,
		}, {
			aoeAction: ACTIONS.LADONSBITE,
			stActions: [ACTIONS.BURST_SHOT],
			minTargets: 2,
		}, {
			aoeAction: ACTIONS.SHADOWBITE,
			stActions: [ACTIONS.BURST_SHOT],
			minTargets: 2,
		}, {
			aoeAction: ACTIONS.RAIN_OF_DEATH,
			stActions: [ACTIONS.BLOODLETTER],
			minTargets: 2,
		},
	]
}
