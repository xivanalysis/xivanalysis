import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

// there's also the case where if you have further ruin and an egi is about to do gcd + ogcd and they held, that can be considered a no no
// also if they are holding further ruin during Bahamut what are they even doing
// that one is major as hell
// if we consider one pet gcd cycle, that's generally going to be 1-2 player gcds
// which is an acceptable tolerance
// ....................->...........PetAction procs FurtherRuin ->...........PetAction procs FurtherRuin ->
// 	previousGCD -> (further ruin procs) Ruin 4 -> R2 + weave(+ weave) -> GCD
// Even if the player used r4 early hoping to get another for the r2 weave, it was impossible because the pet's cycle couldn't allow it, the next proc window was after the r2 cast(edited)

export default class Ruin4 extends Module {
	static dependencies = [
		'cooldowns'
	]

	on_cast_byPlayerPet(event) {
		console.log(event.ability.name)
	}

	on_applybuff(event) {
		// Only care about further ruin
		if (event.ability.guid !== STATUSES.FURTHER_RUIN.id) { return }

		// Further Ruin (R4 proc) also reduces the CD on Enkindle by 10 seconds
		this.cooldowns.reduceCooldown(ACTIONS.ENKINDLE.id, 10)
	}
}
