import {AoEUsages as CoreAoE} from 'parser/core/modules/AoEUsages'

export class AoEUsages extends CoreAoE {
	suggestionIcon = this.data.actions.FOUL.icon

	trackedActions = [
		{
			aoeAction: this.data.actions.FOUL,
			stActions: [this.data.actions.XENOGLOSSY],
			minTargets: 2,
		},
		{
			aoeAction: this.data.actions.FLARE,
			stActions: [this.data.actions.DESPAIR],
			minTargets: 2,
		},
		{
			aoeAction: this.data.actions.THUNDER_IV,
			stActions: [this.data.actions.THUNDER_III],
			minTargets: 2,
		},
	]
}
