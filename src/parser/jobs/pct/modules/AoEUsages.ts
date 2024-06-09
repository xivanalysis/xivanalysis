import {AoEUsages as CoreAoE} from 'parser/core/modules/AoEUsages'

export class AoEUsages extends CoreAoE {
	suggestionIcon = this.data.actions.FOUL.icon

	trackedActions = [
		{
			aoeAction: this.data.actions.FIRE_II_IN_RED,
			stActions: [this.data.actions.FIRE_IN_RED],
			minTargets: 5,
		},
		{
			aoeAction: this.data.actions.AERO_II_IN_GREEN,
			stActions: [this.data.actions.AERO_IN_GREEN],
			minTargets: 5,
		},
		{
			aoeAction: this.data.actions.WATER_II_IN_BLUE,
			stActions: [this.data.actions.WATER_IN_BLUE],
			minTargets: 4,
		},
		{
			aoeAction: this.data.actions.BLIZZARD_II_IN_CYAN,
			stActions: [this.data.actions.BLIZZARD_IN_CYAN],
			minTargets: 5,
		},
		{
			aoeAction: this.data.actions.STONE_II_IN_YELLOW,
			stActions: [this.data.actions.STONE_IN_YELLOW],
			minTargets: 5,
		},
		{
			aoeAction: this.data.actions.THUNDER_II_IN_MAGENTA,
			stActions: [this.data.actions.THUNDER_IN_MAGENTA],
			minTargets: 4,
		},
	]
}
