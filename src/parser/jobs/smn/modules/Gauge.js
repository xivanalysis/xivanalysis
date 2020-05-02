import {Plural, Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import PETS from 'data/PETS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {DWT_LENGTH} from './DWT'
import {getDataBy} from 'data'
import {DEMI_SUMMON_LENGTH} from './Pets'

const AETHER_ACTIONS = [
	ACTIONS.FESTER.id,
	ACTIONS.PAINFLARE.id,
]

const MAX_AETHERFLOW = 2
// 5s cooldown of Fester + 2.5s of GCD slop time in case Fester couldn't be used same GCD as Energy Drain/Siphon
const MIN_AETHERFLOW_SPEND_LENGTH = 7500

export const DEMIS = [
	PETS.DEMI_BAHAMUT.id,
	PETS.DEMI_PHOENIX.id,
]

// Neither act nor fflogs track gauge very well, so let's do it ourselves
export default class Gauge extends Module {
	static handle = 'gauge'
	static dependencies = [
		'brokenLog',
		'pets',
		'suggestions',
	]

	// -----
	// Properties
	// -----
	_aetherflow = 0
	_rushingAetherflow = false

	// Track lost stacks
	_lostAetherflow = 0

	// First DWT should be rushed. Also used for end-of-fight rush
	_rushing = true

	constructor(...args) {
		super(...args)
		this.addEventHook('cast', {by: 'player'}, this._onCast)
		this.addEventHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.DREADWYRM_TRANCE.id,
		}, this._onRemoveDwt)
		this.addEventHook('death', {to: 'player'}, this._onDeath)
		this.addEventHook('complete', this._onComplete)
	}

	// -----
	// API
	// -----
	demiSummoned() {
		const pet = this.pets.getCurrentPet()
		return pet && DEMIS.includes(pet.id)
	}

	isRushing() {
		return this._rushing
	}

	isRushingAetherflow() {
		return this._rushingAetherflow
	}

	// -----
	// Event handling
	// -----
	_onCast(event) {
		const abilityId = event.ability.guid
		const fightTimeRemaining = this.parser.fight.end_time - event.timestamp

		if (abilityId === ACTIONS.ENERGY_DRAIN.id || abilityId === ACTIONS.ENERGY_SIPHON.id) {
			// Energy Drain/Siphon restores up to 2 flow stacks
			// flow can never be > 2, so any remaining on cast is lost
			this._lostAetherflow += this._aetherflow
			this._aetherflow = MAX_AETHERFLOW
			this._rushingAetherflow = MIN_AETHERFLOW_SPEND_LENGTH >= fightTimeRemaining
		}

		if (AETHER_ACTIONS.includes(abilityId)) {
			if (this._aetherflow > 0) {
				this._aetherflow --
			} else {
				const action = getDataBy(ACTIONS, 'id', event.ability.guid)
				this.brokenLog.trigger(this, 'aetherflow action at 0', (
					<Trans id="smn.gauge.aetherflow-action-at-0">
						A cast of <ActionLink {...action}/> was recorded with an expected 0 Aetherflow stacks available.
					</Trans>
				))
			}
		}

		// Check if they're (potentially) rushing DWT -> Demi
		if (abilityId === ACTIONS.DREADWYRM_TRANCE.id) {
			this._rushing = (DWT_LENGTH + DEMI_SUMMON_LENGTH) >= fightTimeRemaining
		}
	}

	_onRemoveDwt(event) {
		// If they've got bahamut ready, but won't have enough time in the fight to effectively use him, they're rushing.
		const fightTimeRemaining = this.parser.fight.end_time - event.timestamp
		if (fightTimeRemaining < DEMI_SUMMON_LENGTH) {
			this._rushing = true
		}
	}

	_onDeath() {
		// Death just flat out resets everything. Rip.
		// Not counting the loss towards the rest of the gauge loss, that'll just double up on the suggestions
		this._aetherflow = 0
	}

	_onComplete() {
		// Suggestions for lost stacks
		if (this._lostAetherflow) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ENERGY_DRAIN.icon,
				content: <Trans id="smn.gauge.suggestions.lost-aetherflow.content">
					Ensure you gain a full 2 stacks of Aetherflow per cast. Every lost stack is a significant potency loss.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="smn.gauge.suggestions.lost-aetherflow.why">
					<Plural value={this._lostAetherflow} one="# stack" other="# stacks"/>
					of Aetherflow lost.
				</Trans>,
			}))
		}
	}
}
