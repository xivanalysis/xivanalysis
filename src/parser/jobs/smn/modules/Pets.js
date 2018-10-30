import {Trans, i18nMark} from '@lingui/react'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import PieChartWithLegend from 'components/ui/PieChartWithLegend'
import ACTIONS, {getAction} from 'data/ACTIONS'
import JOBS, {ROLES} from 'data/JOBS'
import PATCHES, {getPatch} from 'data/PATCHES'
import PETS from 'data/PETS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const NO_PET_ID = -1

const SUMMON_ACTIONS = {
	[ACTIONS.SUMMON.id]: PETS.GARUDA_EGI.id,
	[ACTIONS.SUMMON_II.id]: PETS.TITAN_EGI.id,
	[ACTIONS.SUMMON_III.id]: PETS.IFRIT_EGI.id,
	[ACTIONS.SUMMON_BAHAMUT.id]: PETS.DEMI_BAHAMUT.id,
}

const CHART_COLOURS = {
	[NO_PET_ID]: '#888',
	[PETS.GARUDA_EGI.id]: '#9c0',
	[PETS.TITAN_EGI.id]: '#ffbf23',
	[PETS.IFRIT_EGI.id]: '#d60808',
	[PETS.DEMI_BAHAMUT.id]: '#218cd6',
}

const TITAN_WARN_PERCENT = 5

// Durations should probably be ACTIONS data
export const SUMMON_BAHAMUT_LENGTH = 20000

// noPetUptime severity, in %
const NO_PET_SEVERITY = {
	1: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

export default class Pets extends Module {
	static handle = 'pets'
	static i18n_id = i18nMark('smn.pets.title')
	static dependencies = [
		'suggestions',
	]
	static displayOrder = DISPLAY_ORDER.PETS

	_lastPet = {id: NO_PET_ID}
	_currentPet = null
	_history = []

	_lastSummonBahamut = -1

	_petUptime = new Map()

	constructor(...args) {
		super(...args)
		this.addHook('init', this._onInit)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('all', this._onEvent)
		this.addHook('summonpet', this._onChangePet)
		this.addHook('death', {to: 'pet'}, this._onPetDeath)
		this.addHook('complete', this._onComplete)
	}

	normalise(events) {
		const petCache = {}

		// Try to spot an event that'd signal what pet they've started with
		for (let i = 0; i < events.length; i++) {
			const event = events[i]

			// If there's no ability for the event, just skip it
			if (!event.ability) {
				continue
			}

			const action = getAction(event.ability.guid)

			// I mean this shouldn't happen but people are stupid.
			// If there's a summon cast before any pet action, they didn't start with a pet.
			if (action.id && Object.keys(SUMMON_ACTIONS).includes(action.id.toString())) {
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
			this._lastPet = {id: action.pet}
			break
		}

		return events
	}

	_onInit() {
		// Just holding off the setPet until now so no events being created during normalise
		this.setPet(this._lastPet.id)
	}

	_onCast(event) {
		const petId = SUMMON_ACTIONS[event.ability.guid]

		if (!petId) {
			return
		}

		// If it's bahamut, we need to handle the timer
		if (petId === PETS.DEMI_BAHAMUT.id) {
			this._lastSummonBahamut = event.timestamp
		}

		this.setPet(petId)
	}

	_onEvent(event) {
		if (
			(this._lastPet || this.parser.byPlayerPet(event)) &&
			this._currentPet &&
			this._currentPet.id === PETS.DEMI_BAHAMUT.id &&
			this._lastSummonBahamut + SUMMON_BAHAMUT_LENGTH <= event.timestamp
		) {
			let petId = null
			if (this._lastPet) {
				petId = this._lastPet.id
			} else {
				petId = getAction(event.ability.guid).pet
			}

			this.setPet(petId, this._lastSummonBahamut + SUMMON_BAHAMUT_LENGTH)
		}
	}

	_onChangePet(event) {
		this._lastPet = this._currentPet
		this._currentPet = {
			id: event.petId,
			timestamp: event.timestamp,
		}

		if (this._lastPet) {
			const id = this._lastPet.id
			const start = this._lastPet.timestamp
			const end = event.timestamp

			this._history.push({id, start, end})
			const value = (this._petUptime.get(id) || 0) + end - start
			this._petUptime.set(id, value)
		}
	}

	_onPetDeath() {
		this.setPet(NO_PET_ID)
	}

	_onComplete(event) {
		// Finalise the history
		let id = NO_PET_ID
		let start = this.parser.fight.start_time
		if (this._currentPet) {
			id = this._currentPet.id
			start = this._currentPet.timestamp
		}
		const end = event.timestamp

		this._history.push({id, start, end})
		const value = (this._petUptime.get(id) || 0) + end - start
		this._petUptime.set(id, value)

		// Work out the party comp
		// TODO: Should this be in the parser?
		const roles = this.parser.fightFriendlies.reduce((roles, friendly) => {
			const job = JOBS[friendly.type]
			if (!job) { return roles }

			roles[job.role] = (roles[job.role] || 0) + 1
			return roles
		}, {})

		// Pet suggestions based on party comp
		// TODO: This does not account for invuln periods
		const numCasters = roles[ROLES.MAGICAL_RANGED.id]
		const mostUsedPet = Array.from(this._petUptime.keys()).sort(
			(a, b) => this._petUptime.get(b) - this._petUptime.get(a)
		)[0]

		if (numCasters > 1 && mostUsedPet !== PETS.GARUDA_EGI.id) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SUMMON.icon,
				severity: SEVERITY.MEDIUM,
				content: <Trans id="smn.pets.suggestions.prefer-garuda.content">
					You should be primarily using Garuda-Egi when in parties with casters other than yourself - they will benefit from <ActionLink {...ACTIONS.CONTAGION}/>'s Magic Vulnerability Up.
				</Trans>,
				why: <Trans id="smn.pets.suggestions.prefer-garuda.why">
					{this.getPetUptimePercent(mostUsedPet)}% {this.getPetName(mostUsedPet)} uptime, Garuda-Egi preferred.
				</Trans>,
			}))
		}

		// Disabling ifrit check post-4.4 due to changes made to RS
		const currentPatch = getPatch(this.parser.parseDate)
		const pre44 = PATCHES[currentPatch].date < PATCHES['4.4'].date

		if (pre44 && numCasters === 1 && mostUsedPet !== PETS.IFRIT_EGI.id) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SUMMON_III.icon,
				severity: SEVERITY.MEDIUM,
				content: <Trans id="smn.pets.suggestions.prefer-ifrit.content">
					You should be primarily using Ifrit-Egi when there are no other casters in the party - Ifrit's raw damage and <ActionLink {...ACTIONS.RADIANT_SHIELD}/> provide more than Garuda can bring to the table in these scenarios.
				</Trans>,
				why: <Trans id="smn.pets.suggestions.prefer-ifrit.why">
					{this.getPetUptimePercent(mostUsedPet)}% {this.getPetName(mostUsedPet)} uptime, Ifrit-Egi preferred.
				</Trans>,
			}))
		}

		// We'll let them get away with a tiny bit of Chucken Nugget, but... not too much.
		const titanUptimePercent = this.getPetUptimePercent(PETS.TITAN_EGI.id)
		if (titanUptimePercent > TITAN_WARN_PERCENT) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SUMMON_II.icon,
				severity: SEVERITY.MAJOR,
				content: <Trans id="smn.pets.suggestions.titan.content">
					Titan-Egi generally should not be used in party content. Switch to Ifrit-Egi, or Garuda-Egi if you have multiple casters.
				</Trans>,
				why: <Trans id="smn.pets.suggestions.titan.why">
					{titanUptimePercent}% Titan-Egi uptime.
				</Trans>,
			}))
		}

		// Pets are important, k?
		const noPetUptimePercent = this.getPetUptimePercent(NO_PET_ID)
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SUMMON.icon,
			tiers: NO_PET_SEVERITY,
			value: noPetUptimePercent,
			content: <Trans id="smn.pets.suggestions.no-pet.content">
				Pets provide a <em>lot</em> of SMN's passive damage, and are essential for <StatusLink {...STATUSES.FURTHER_RUIN}/> procs and <ActionLink {...ACTIONS.ENKINDLE}/>. Make sure you have a pet summoned at all times, and keep them out of boss AoEs.
			</Trans>,
			why: <Trans id="smn.pets.suggestions.no-pet.why">
				No pet summoned for {noPetUptimePercent}% of the fight (&lt;1% is recommended).
			</Trans>,
		}))
	}

	getPetUptimePercent(petId) {
		const percent = (this._petUptime.get(petId) || 0) / this.parser.fightDuration
		return (percent * 100).toFixed(2)
	}

	setPet(petId, timestamp) {
		this.parser.fabricateEvent({
			type: 'summonpet',
			timestamp: timestamp || this.parser.currentTimestamp,
			petId: petId,
		})
	}

	getCurrentPet() {
		if (!this._currentPet) {
			return null
		}

		return PETS[this._currentPet.id]
	}

	getPetName(petId) {
		if (petId === NO_PET_ID) {
			return 'No pet'
		}

		return PETS[petId].name
	}

	output() {
		const uptimeKeys = Array.from(this._petUptime.keys())

		const data = uptimeKeys.map(id => {
			const value = this._petUptime.get(id)
			return {
				value,
				label: this.getPetName(id),
				backgroundColor: CHART_COLOURS[id],
				additional: [
					this.parser.formatDuration(value),
					this.getPetUptimePercent(id) + '%',
				],
			}
		})

		return <PieChartWithLegend
			headers={{
				label: 'Pet',
				additional: [
					'Uptime',
					'%',
				],
			}}
			data={data}
		/>
	}
}
