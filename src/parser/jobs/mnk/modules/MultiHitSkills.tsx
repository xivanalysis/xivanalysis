import {dependency} from 'parser/core/Module'
import {AoEAction, AoEUsages} from 'parser/core/modules/AoEUsages'
import Combatants from 'parser/core/modules/Combatants'
import {Data} from 'parser/core/modules/Data'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'

export default class AoE extends AoEUsages {
	static handle = 'aoe'

	@dependency private combatants!: Combatants
	@dependency private data!: Data

	// You awake to find yourself enlightened to the true power of AoE
	suggestionIcon = this.data.actions.ENLIGHTENMENT.icon

	// Assuming user is in the correct Form
	// Technically, FPF is 3 however if the buff is about to fall off, it's 2.
	// Tracking remaining duration is kind of a pain here due to Anatman so eh.
	trackedActions: AoEAction[] = [
		{
			aoeAction: this.data.actions.ARM_OF_THE_DESTROYER,
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
			minTargets: 2,
		},
		{
			aoeAction: this.data.actions.ENLIGHTENMENT,
			stActions: [this.data.actions.THE_FORBIDDEN_CHAKRA],
			minTargets: 2,
		},
	]

	protected adjustMinTargets(event: NormalisedDamageEvent, minTargets: number): number {
		const action = this.data.getAction(event.ability.guid)

		// How in the fuck did we even get here tbh
		if (!action) {
			return minTargets
		}

		// If Leaden Fist is up, Boot is extra strong
		if (action.id === this.data.actions.ARM_OF_THE_DESTROYER.id && this.combatants.selected.hasStatus(this.data.statuses.LEADEN_FIST.id)) {
			return minTargets + 1
		}

		return minTargets
	}
}
