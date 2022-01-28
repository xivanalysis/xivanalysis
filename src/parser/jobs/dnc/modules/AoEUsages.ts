import {AoEUsages as CoreAoE} from 'parser/core/modules/AoEUsages'

export class AoEUsages extends CoreAoE {
	suggestionIcon = this.data.actions.WINDMILL.icon

	trackedActions = [
		{
			aoeAction: this.data.actions.WINDMILL,
			stActions: [this.data.actions.CASCADE],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.RISING_WINDMILL,
			stActions: [this.data.actions.REVERSE_CASCADE],
			minTargets: 2,
		},
		{
			aoeAction: this.data.actions.BLOODSHOWER,
			stActions: [this.data.actions.FOUNTAINFALL],
			minTargets: 2,
		},
	]
}
