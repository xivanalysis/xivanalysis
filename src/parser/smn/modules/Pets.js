import React, { Fragment } from 'react'

import { ActionLink } from 'components/ui/DbLink'
import ACTIONS, { getAction } from 'data/ACTIONS'
import JOBS, { ROLES } from 'data/JOBS'
import PETS from 'data/PETS'
import Module from 'parser/core/Module'
import { Suggestion, SEVERITY } from 'parser/core/modules/Suggestions'

const SUMMON_ACTIONS = {
	[ACTIONS.SUMMON.id]: PETS.GARUDA_EGI.id,
	[ACTIONS.SUMMON_II.id]: PETS.TITAN_EGI.id,
	[ACTIONS.SUMMON_III.id]: PETS.IFRIT_EGI.id,
	[ACTIONS.SUMMON_BAHAMUT.id]: PETS.DEMI_BAHAMUT.id
}

// Durations should probably be ACTIONS data
const SUMMON_BAHAMUT_LENGTH = 20000

export default class Pets extends Module {
	static dependencies = [
		'suggestions'
	]
	static displayOrder = -100

	lastPet = null
	currentPet = null
	history = []

	lastSummonBahamut = -1

	petUptime = {}

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
			this.lastPet = {id: action.pet}
			break
		}

		return events
	}

	on_init() {
		// Just holding off the setPet until now so no events being created during normalise
		this.setPet(this.lastPet.id)
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
			this.currentPet &&
			this.currentPet.id === PETS.DEMI_BAHAMUT.id &&
			this.lastSummonBahamut + SUMMON_BAHAMUT_LENGTH <= event.timestamp
		) {
			this.setPet(this.lastPet.id, this.lastSummonBahamut + SUMMON_BAHAMUT_LENGTH)
		}
	}

	on_complete(event) {
		// Finalise the history
		const id = this.currentPet.id
		const start = this.currentPet.timestamp
		const end = event.timestamp

		this.history.push({id, start, end})
		this.petUptime[id] = (this.petUptime[id] || 0) + end - start

		// Work out the party comp
		// TODO: Should this be in the parser?
		const roles = this.parser.fightFriendlies.reduce((roles, friendly) => {
			const job = JOBS[friendly.type]
			if (!job) { return roles }

			roles[job.role] = (roles[job.role] || 0) + 1
			return roles
		}, {})

		// Pet suggestions based on party comp
		const numCasters = roles[ROLES.MAGICAL_RANGED.id]
		const mostUsedPet = parseInt(Object.keys(this.petUptime).sort(
			(a, b) => this.petUptime[b] - this.petUptime[a]
		)[0], 10)

		if (numCasters > 1 && mostUsedPet !== PETS.GARUDA_EGI.id) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SUMMON.icon,
				why: `${this.getPetUptimePercent(mostUsedPet)}% ${PETS[mostUsedPet].name} uptime, Garuda-Egi preferred.`,
				severity: SEVERITY.MEDIUM,
				content: <Fragment>
					You should be primarily using Garuda-Egi when in parties with casters other than yourself - they will benefit from <ActionLink {...ACTIONS.CONTAGION}/>&apos;s Magic Vulnerability Up.
				</Fragment>
			}))
		}

		if (numCasters === 1 && mostUsedPet !== PETS.IFRIT_EGI.id) {
			console.log('MEDIUM: Should use ifrit')
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SUMMON_III.icon,
				why: `${this.getPetUptimePercent(mostUsedPet)}% ${PETS[mostUsedPet].name} uptime, Ifrit-Egi preferred.`,
				severity: SEVERITY.MEDIUM,
				content: <Fragment>
					You should be primarily using Ifrit-Egi when there are no other casters in the party - Ifrit&apos;s raw damage and <ActionLink {...ACTIONS.RADIANT_SHIELD}/> provide more than Garuda can bring to the table in these scenarios.
				</Fragment>
			}))
		}

		// We'll let them get away with a tiny bit of Chucken Nugget, but... not too much.
		const titanUptimePercent = this.getPetUptimePercent(PETS.TITAN_EGI.id)
		if (titanUptimePercent > 10) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SUMMON_II.icon,
				why: `${titanUptimePercent}% Titan-Egi uptime.`,
				severity: SEVERITY.MAJOR,
				content: <Fragment>
					Titan-Egi generally should not be used in party content. Switch to Ifrit-Egi, or Garuda-Egi if you have multiple casters.
				</Fragment>
			}))
		}
	}

	getPetUptimePercent(petId) {
		const percent = (this.petUptime[petId] || 0) / this.parser.fightDuration
		return Math.round(percent * 10000) / 100
	}

	// TODO: What about when a pet dies?

	setPet(petId, timestamp) {
		timestamp = timestamp || this.parser.currentTimestamp

		this.lastPet = this.currentPet
		this.currentPet = {
			id: petId,
			timestamp
		}

		if (this.lastPet) {
			const id = this.lastPet.id
			const start = this.lastPet.timestamp
			const end = timestamp

			this.history.push({id, start, end})
			this.petUptime[id] = (this.petUptime[id] || 0) + end - start
		}

		this.parser.fabricateEvent({
			type: 'summonpet',
			timestamp,
			petId: petId
		})
	}

	getCurrentPet() {
		return PETS[this.currentPet.id]
	}

	output() {
		const fightDuration = this.parser.fightDuration

		return <ul>
			{Object.keys(this.petUptime).map(petId => <li key={petId}>
				Pet: {PETS[petId].name}<br/>
				Uptime: {this.parser.formatDuration(this.petUptime[petId])}<br/>
				%: {(this.petUptime[petId]/fightDuration)*100}
			</li>)}
		</ul>
	}
}
