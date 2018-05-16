import ACTIONS, { getAction } from 'data/ACTIONS'
import PETS from 'data/PETS'
import Module from 'parser/core/Module'

export default class Pets extends Module {
	currentPet = null

	normalise(events) {
		const petCache = {}

		// Try to spot an event that'd signal what pet they've started with
		for (let i = 0; i < events.length; i++) {
			const event = events[i]
			const action = getAction(event.ability.guid)

			// I mean this shouldn't happen but people are stupid.
			// If there's a summon cast before any pet action, they didn't start with a pet.
			if ([
				ACTIONS.SUMMON,
				ACTIONS.SUMMON_II,
				ACTIONS.SUMMON_III
			].includes(action.id)) {
				break
			}

			const pet = petCache[event.sourceID]
				|| this.parser.report.friendlyPets.find(pet => pet.id === event.sourceID)
				|| {petOwner: -1}

			// Ignore events we don't care about
			if (
				event.type !== 'cast' ||
				!event.sourceIsFriendly ||
				pet.petOwner !== this.parser.player.id ||
				!action.pet
			) { continue }

			// We've found the first pet cast - that'll be our starting pet
			this.currentPet = action.pet
			break
		}

		return events
	}

	on_init() {
		console.log(PETS[this.currentPet].name)
	}
}
