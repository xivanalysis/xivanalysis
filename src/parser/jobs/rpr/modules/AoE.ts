import {AoEUsages} from 'parser/core/modules/AoEUsages'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class AoE extends AoEUsages {
	static override displayOrder = DISPLAY_ORDER.AOE

	suggestionIcon = this.data.actions.SPINNING_SCYTHE.icon

	trackedActions = [
		{
			aoeAction: this.data.actions.SPINNING_SCYTHE,
			stActions: [this.data.actions.SLICE],
			minTargets: 3,
		}, {
			aoeAction: this.data.actions.SOUL_SCYTHE,
			stActions: [this.data.actions.SOUL_SLICE],
			minTargets: 3,
		}, {
			aoeAction: this.data.actions.WHORL_OF_DEATH,
			stActions: [this.data.actions.SHADOW_OF_DEATH],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.GRIM_SWATHE,
			stActions: [this.data.actions.BLOOD_STALK],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.GUILLOTINE,
			stActions: [this.data.actions.GALLOWS, this.data.actions.GIBBET],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.LEMURES_SCYTHE,
			stActions: [this.data.actions.LEMURES_SLICE],
			minTargets: 2,
		},
		{
			aoeAction: this.data.actions.GRIM_REAPING,
			stActions: [this.data.actions.VOID_REAPING, this.data.actions.CROSS_REAPING],
			minTargets: 3,
		},
	]
}
