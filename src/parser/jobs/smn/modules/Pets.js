import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import PETS from 'data/PETS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {PieChartStatistic} from 'parser/core/modules/Statistics'
import {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const NO_PET_ID = -1

const PET_RESYNC_BUFFER_MS = 3000

const SUMMON_ACTIONS = {
	[ACTIONS.SUMMON.id]: PETS.GARUDA_EGI.id,
	[ACTIONS.SUMMON_II.id]: PETS.TITAN_EGI.id,
	[ACTIONS.SUMMON_III.id]: PETS.IFRIT_EGI.id,
	[ACTIONS.SUMMON_BAHAMUT.id]: PETS.DEMI_BAHAMUT.id,
	[ACTIONS.FIREBIRD_TRANCE.id]: PETS.DEMI_PHOENIX.id,
}

const CHART_COLOURS = {
	[NO_PET_ID]: '#888',
	[PETS.GARUDA_EGI.id]: '#9c0',
	[PETS.TITAN_EGI.id]: '#ffbf23',
	[PETS.IFRIT_EGI.id]: '#d60808',
	[PETS.DEMI_BAHAMUT.id]: '#218cd6',
	[PETS.DEMI_PHOENIX.id]: '#ff6a00',
}

const IFRIT_AOE_CAPABLE_ACTIONS = [
	ACTIONS.FLAMING_CRUSH.id,
	ACTIONS.INFERNO.id,
]

const TITAN_WARN_PERCENT = 5
const GARUDA_MIN_TARGETS = 3

const WIND_BLADE_RECAST = 3000
const SLIPSTREAM_TICKS = 4 //3 from duration + 1 on cast
const SLIPSTREAM_TICK_SPEED = 3000

const SLIPSTREAM_SEVERITY = {
	1: SEVERITY.MINOR,
	[SLIPSTREAM_TICKS]: SEVERITY.MEDIUM,
	[2 * SLIPSTREAM_TICKS]: SEVERITY.MAJOR,
}

// Durations should probably be ACTIONS data
export const DEMI_SUMMON_LENGTH = 20000

// noPetUptime severity, in %
const NO_PET_SEVERITY = {
	1: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

// Garuda-Egi single target severity, in %
// To avoid triggering a message from the occasional single hit on the
// last enemy in a group, the minimum warning level is set to 10%.
const GARUDA_ST_SEVERITY = {
	10: SEVERITY.MINOR,
	33: SEVERITY.MEDIUM,
}

export default class Pets extends Module {
	static handle = 'pets'
	static title = t('smn.pets.title')`Pets`
	static dependencies = [
		'statistics',
		'suggestions',
	]
	static displayOrder = DISPLAY_ORDER.PETS

	_lastPet = {id: NO_PET_ID}
	_currentPet = null
	_history = []

	_slipstreams = []
	_badWindBlades = 0
	_ifritMultiHits = 0

	_petUptime = new Map()

	constructor(...args) {
		super(...args)
		this.addEventHook('init', this._onInit)
		this.addEventHook('cast', {by: 'player'}, this._onCast)
		this.addEventHook('normaliseddamage', {by: 'pet'}, this._onPetDamage)
		this.addEventHook('summonpet', this._onChangePet)
		// Hook changed from on pet death to on player death due to pet changes in Shadowbringers
		// Pets now won't die unless their caster dies, so FFLogs API no longer emitting pet death events
		this.addEventHook('death', {to: 'player'}, this._onDeath)
		this.addEventHook('complete', this._onComplete)
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

			const action = getDataBy(ACTIONS, 'id', event.ability.guid)
			if (!action) { continue }

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

		// If it's a demi, we need to handle the timer
		if (this.isDemiPet(petId)) {
			this.addTimestampHook(event.timestamp + DEMI_SUMMON_LENGTH, this._onDemiExpire)
		}

		this.setPet(petId)
	}

	_onDemiExpire() {
		this.setPet(this._lastPet.id)
	}

	_onPetDamage(event) {
		const abilityId = event.ability.guid

		// If the action is being cast by a pet that isn't the current pet, tracking has desynced - attempt to resync
		// This usually happens if the player somehow had a demi out before the start of the log.
		// Explicitly _prevent_ resync if there was a switch in the last 3s - actions from the previous pet may still be applying
		const action = getDataBy(ACTIONS, 'id', abilityId)
		if (
			action &&
			action.pet &&
			(this._currentPet === null ||
				(action.pet !== this._currentPet.id &&
				event.timestamp - this._currentPet.timestamp > PET_RESYNC_BUFFER_MS)
			)
		) {
			this.setPet(action.pet)
		}

		if (abilityId === ACTIONS.WIND_BLADE.id &&
			event.hitCount < GARUDA_MIN_TARGETS) {
			this._badWindBlades++
		} else if (abilityId === ACTIONS.SLIPSTREAM.id) {
			this._slipstreams.push({
				cast: event,
				ticks: [],
			})
		} else if (abilityId === STATUSES.GALE_ENFORCER.id) {
			// if a Gale Enforcer tick happens without a recorded Slipstream, synthesize one here
			if (!this._slipstreams.length) {
				this._slipstreams.push({
					cast: event,
					ticks: [],
				})
			}
			this._slipstreams[this._slipstreams.length - 1].ticks.push(event)
		} else if (
			IFRIT_AOE_CAPABLE_ACTIONS.includes(abilityId) &&
			event.hitCount >= GARUDA_MIN_TARGETS
		) {
			this._ifritMultiHits++
		}
	}

	_onChangePet(event) {
		if (this._currentPet) {
			this._lastPet = this._currentPet
		}
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

	_onDeath() {
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

		// Check ticks of Slipstream to detect cases where it was used against adds that died
		// or where a new pet (including demis) was summoned before the end of the duration
		const missedTicks = this._slipstreams.reduce((acc, cur) => {
			const tickCount = cur.ticks.length
			const possibleTicks = Math.min(SLIPSTREAM_TICKS, Math.floor((this.parser.fight.end_time - cur.cast.timestamp) / SLIPSTREAM_TICK_SPEED))

			return acc + (possibleTicks - Math.min(possibleTicks, tickCount))
		}, 0)

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SLIPSTREAM.icon,
			tiers: SLIPSTREAM_SEVERITY,
			value: missedTicks,
			content: <Trans id="smn.pets.suggestions.slipstream-ticks.content">
				Ensure you use <ActionLink {...ACTIONS.SLIPSTREAM} /> such that it can deal damage for its entire duration.
				Summoning another pet or recasting Slipstream will prevent any remaining ticks of a cast.
			</Trans>,
			why: <Trans id="smn.pets.suggestions.slipstream-ticks.why">
				<Plural value={missedTicks} one="# missed tick" other="# missed ticks" /> of Slipstream.
			</Trans>,
		}))

		// Ensure Garuda is being used in AoE
		const garudaStPercent = Math.min(100, (((this._badWindBlades * WIND_BLADE_RECAST) / this._petUptime.get(PETS.GARUDA_EGI.id)) * 100))
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SUMMON.icon,
			tiers: GARUDA_ST_SEVERITY,
			value: garudaStPercent,
			content: <Trans id="smn.pets.suggestions.garuda-st.content">
				Garuda-Egi should only be used for AoE.  Use Ifrit-Egi instead when only a single target is available, as it will deal more damage.
			</Trans>,
			why: <Trans id="smn.pets.suggestions.garuda-st.why">
				Garuda-Egi was attacking a single target {garudaStPercent.toFixed(0)}% of the time it was active.
			</Trans>,
		}))

		// Since Ifrit's EA2 and Enkindle hit AoE, we can sometimes tell that
		// it was used in an AoE situation, but we can't tell any more often than
		// when those particular skills are used.  Therefore, just list this as Medium
		// rather than trying to determine a percentage like we did with Garuda.
		if (this._ifritMultiHits > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SUMMON_III.icon,
				severity: SEVERITY.MEDIUM,
				content: <Trans id="smn.pets.suggestions.ifrit-aoe.content">
					Ifrit-Egi should only be used for single target.  Use Garuda-Egi instead when multiple targets are available, as it will deal more damage.
				</Trans>,
				why: <Trans id="smn.pets.suggestions.ifrit-aoe.why">
					Ifrit-Egi hit multiple targets with <Plural value={this._ifritMultiHits} one="# use" other="# uses" /> of <ActionLink {...ACTIONS.FLAMING_CRUSH} /> or <ActionLink {...ACTIONS.INFERNO} />.
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
					Titan-Egi generally should not be used in party content. Switch to Ifrit-Egi or Garuda-Egi instead.
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

		// Statistic
		const uptimeKeys = Array.from(this._petUptime.keys())
		const data = uptimeKeys.map(id => {
			const value = this._petUptime.get(id)
			return {
				value,
				color: CHART_COLOURS[id],
				columns: [
					this.getPetName(id),
					this.parser.formatDuration(value),
					this.getPetUptimePercent(id) + '%',
				],
			}
		})

		this.statistics.add(new PieChartStatistic({
			headings: ['Pet', 'Uptime', '%'],
			data,
		}))
	}

	getPetUptimePercent(petId) {
		const percent = (this._petUptime.get(petId) || 0) / this.parser.currentDuration
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

		return getDataBy(PETS, 'id', this._currentPet.id)
	}

	getPetName(petId) {
		if (petId === NO_PET_ID) {
			return 'No pet'
		}

		return getDataBy(PETS, 'id', petId).name
	}

	isDemiPet(petId) {
		return petId === PETS.DEMI_BAHAMUT.id || petId === PETS.DEMI_PHOENIX.id
	}

}
