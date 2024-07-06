import {AoEUsages} from 'parser/core/modules/AoEUsages'

export class MultiHitSkills extends AoEUsages {
	suggestionIcon = this.data.actions.QUIETUS.icon

	trackedActions = [
		{
			aoeAction: this.data.actions.FLOOD_OF_SHADOW,
			stActions: [this.data.actions.EDGE_OF_SHADOW],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.QUIETUS,
			stActions: [this.data.actions.BLOODSPILLER],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.IMPALEMENT,
			stActions: [this.data.actions.SCARLET_DELIRIUM],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.ABYSSAL_DRAIN,
			stActions: [this.data.actions.CARVE_AND_SPIT],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.UNLEASH,
			stActions: [this.data.actions.HARD_SLASH],
			minTargets: 3,
		},
	]
}
