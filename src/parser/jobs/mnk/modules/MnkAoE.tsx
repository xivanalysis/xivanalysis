import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {dependency} from 'parser/core/Module'
import {AoeAbility, AoEUsages} from 'parser/core/modules/AoEUsages'
import Combatants from 'parser/core/modules/Combatants'
import {Data} from 'parser/core/modules/Data'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'

export default class MnkAoE extends AoEUsages {
	static handle = 'mnkaoe'

	@dependency private combatants!: Combatants
	@dependency private data!: Data

	// You awake to find yourself enlightened to the true power of AoE
	suggestionIcon = ACTIONS.ENLIGHTENMENT.icon

	// Assuming user is in the correct Form
	trackedAbilities: AoeAbility[] = [
		{
			aoeAbility: ACTIONS.ARM_OF_THE_DESTROYER,
			stAbilities: [ACTIONS.BOOTSHINE, ACTIONS.DRAGON_KICK],
			minTargets: 3,
		},
		{
			aoeAbility: ACTIONS.FOUR_POINT_FURY,
			stAbilities: [ACTIONS.TRUE_STRIKE, ACTIONS.TWIN_SNAKES],
			minTargets: 2,
		},
		{
			aoeAbility: ACTIONS.ROCKBREAKER,
			stAbilities: [ACTIONS.DEMOLISH, ACTIONS.SNAP_PUNCH],
			minTargets: 2,
		},
		{
			aoeAbility: ACTIONS.ENLIGHTENMENT,
			stAbilities: [ACTIONS.THE_FORBIDDEN_CHAKRA],
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
		if (action.id === ACTIONS.ARM_OF_THE_DESTROYER.id && this.combatants.selected.hasStatus(STATUSES.LEADEN_FIST.id)) {
			return minTargets + 1
		}

		return minTargets
	}
}
