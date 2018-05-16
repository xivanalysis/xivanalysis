import ACTIONS, { getAction } from 'data/ACTIONS'
import PETS from 'data/PETS'
import Module from 'parser/core/Module'

const SUMMON_ACTIONS = {
	[ACTIONS.SUMMON.id]: PETS.GARUDA_EGI.id,
	[ACTIONS.SUMMON_II.id]: PETS.TITAN_EGI.id,
	[ACTIONS.SUMMON_III.id]: PETS.IFRIT_EGI.id,
	[ACTIONS.SUMMON_BAHAMUT.id]: PETS.DEMI_BAHAMUT.id
}

// Durations should probably be ACTIONS data
const SUMMON_BAHAMUT_LENGTH = 20000

export default class Pets extends Module {
	lastPet = null
	currentPet = null

	lastSummonBahamut = -1

	normalise(events) {
		const petCache = {}

		// Try to spot an event that'd signal what pet they've started with
		for (let i = 0; i < events.length; i++) {
			const event = events[i]
			const action = getAction(event.ability.guid)

			// I mean this shouldn't happen but people are stupid.
			// If there's a summon cast before any pet action, they didn't start with a pet.
			if (Object.keys(SUMMON_ACTIONS).includes(action.id)) {
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
			this.lastPet = action.pet
			break
		}

		return events
	}

	on_init() {
		// Just holding off the setPet until now so no events being created during normalise
		this.setPet(this.lastPet)
	}

	on_cast_byPlayer(event) {
		const petId = SUMMON_ACTIONS[event.ability.guid]

		if (!petId) {
			return
		}

		// If it's bahamut, we need to handle the timer
		if (petId === PETS.DEMI_BAHAMUT.id) {
			this.lastSummonBahamut = event.timestamp
		}

		this.setPet(petId)
	}

	on_event(event) {
		if (
			this.currentPet === PETS.DEMI_BAHAMUT.id &&
			this.lastSummonBahamut + SUMMON_BAHAMUT_LENGTH <= event.timestamp
		) {
			this.setPet(this.lastPet, this.lastSummonBahamut + SUMMON_BAHAMUT_LENGTH)
		}
	}

	// TODO: What about when a pet dies?

	setPet(petId, timestamp) {
		this.lastPet = this.currentPet
		this.currentPet = petId

		timestamp = timestamp || this.parser.currentTimestamp

		// TODO: track the history

		this.parser.fabricateEvent({
			type: 'summonpet',
			timestamp,
			petId: petId
		})
	}

	getCurrentPet() {
		return PETS[this.currentPet]
	}
}
