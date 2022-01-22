import {Events} from 'event'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {AoEAction, AoEUsages} from 'parser/core/modules/AoEUsages'

export class AoE extends AoEUsages {
	static override handle = 'aoe'

	@dependency private actors!: Actors

	// You awake to find yourself enlightened to the true power of AoE
	suggestionIcon = this.data.actions.ENLIGHTENMENT.icon

	// SotD is on-par with DK at 2 targets, but needs 3 to beat out Boot
	trackedActions: AoEAction[] = [
		{
			aoeAction: this.data.actions.SHADOW_OF_THE_DESTROYER,
			stActions: [this.data.actions.BOOTSHINE, this.data.actions.DRAGON_KICK],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.FOUR_POINT_FURY,
			stActions: [this.data.actions.TRUE_STRIKE, this.data.actions.TWIN_SNAKES],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.ROCKBREAKER,
			stActions: [this.data.actions.DEMOLISH, this.data.actions.SNAP_PUNCH],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.ENLIGHTENMENT,
			stActions: [this.data.actions.THE_FORBIDDEN_CHAKRA],
			minTargets: 2,
		},
	]

	protected override adjustMinTargets(event: Events['damage'], minTargets: number): number {
		if (event.cause.type !== 'action') {
			return minTargets
		}

		const action = this.data.getAction(event.cause.action)

		// How in the fuck did we even get here tbh
		if (action == null) {
			return minTargets
		}

		// If Leaden Fist is up, Boot is extra strong
		if (action.id === this.data.actions.SHADOW_OF_THE_DESTROYER.id && this.actors.current.hasStatus(this.data.statuses.LEADEN_FIST.id)) {
			return minTargets + 1
		}

		return minTargets
	}
}
