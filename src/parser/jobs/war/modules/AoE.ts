import {AoEUsages} from 'parser/core/modules/AoEUsages'

export class AoE extends AoEUsages {
	suggestionIcon = this.data.actions.OVERPOWER.icon

	trackedActions = [
		{
			aoeAction: this.data.actions.CHAOTIC_CYCLONE,
			stActions: [this.data.actions.INNER_CHAOS],
			minTargets: 3,
		}, {
			aoeAction: this.data.actions.DECIMATE,
			stActions: [this.data.actions.FELL_CLEAVE],
			minTargets: 3,
		}, {
			aoeAction: this.data.actions.OVERPOWER,
			stActions: [this.data.actions.HEAVY_SWING],
			minTargets: 2,
		},
	]
}
