import {AoEUsages as CoreAoE} from 'parser/core/modules/AoEUsages'

export class AoEUsages extends CoreAoE {
	suggestionIcon = this.data.actions.WINDMILL.icon

	trackedActions = [
		{
			aoeAction: this.data.actions.WINDMILL,
			stActions: [this.data.actions.CASCADE],
			minTargets: 2,
		},
	]
}
