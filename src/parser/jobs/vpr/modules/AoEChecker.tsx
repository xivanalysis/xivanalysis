import ACTIONS from 'data/ACTIONS'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {AoEUsages} from 'parser/core/modules/AoEUsages'

export class AoeChecker extends AoEUsages {
	@dependency private actors!: Actors

	suggestionIcon = ACTIONS.DREADWINDER.icon

	trackedActions = [
		{
			aoeAction: ACTIONS.STEEL_MAW,
			stActions: [ACTIONS.STEEL_FANGS],
			minTargets: 3,
		},

		{
			aoeAction: ACTIONS.DREAD_MAW,
			stActions: [ACTIONS.DREAD_FANGS],
			minTargets: 3,
		},

		{
			aoeAction: ACTIONS.PIT_OF_DREAD,
			stActions: [ACTIONS.DREADWINDER],
			minTargets: 3,
		},
	]
}

