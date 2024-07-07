import {AoEAction, AoEUsages} from 'parser/core/modules/AoEUsages'

export class AoE extends AoEUsages {
	static override handle = 'aoe'

	// You awake to find yourself enlightened to the true power of AoE
	suggestionIcon = this.data.actions.ENLIGHTENMENT.icon

	trackedActions: AoEAction[] = [
		{
			aoeAction: this.data.actions.SHADOW_OF_THE_DESTROYER,
			stActions: [this.data.actions.BOOTSHINE, this.data.actions.DRAGON_KICK, this.data.actions.LEAPING_OPO],
			minTargets: 4,
		},
		{
			aoeAction: this.data.actions.FOUR_POINT_FURY,
			stActions: [this.data.actions.TRUE_STRIKE, this.data.actions.TWIN_SNAKES, this.data.actions.RISING_RAPTOR],
			minTargets: 4,
		},
		{
			aoeAction: this.data.actions.ROCKBREAKER,
			stActions: [this.data.actions.DEMOLISH, this.data.actions.SNAP_PUNCH, this.data.actions.POUNCING_COEURL],
			minTargets: 4,
		},
		{
			aoeAction: this.data.actions.ENLIGHTENMENT,
			stActions: [this.data.actions.THE_FORBIDDEN_CHAKRA],
			minTargets: 2,
		},
	]
}
