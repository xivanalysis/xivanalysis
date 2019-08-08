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

export const DEMIS = [
	PETS.DEMI_BAHAMUT.id,
	PETS.DEMI_PHOENIX.id,
]

// Neither act nor fflogs track gauge very well, so let's do it ourselves
export default class Gauge extends Module {
	static handle = 'gauge'
	static dependencies = [
		'brokenLog',
		'cooldowns',
		'pets',
		'suggestions',
	]

	// -----
	// Properties
	// -----
	_aetherflow = 0

	// Track lost stacks
	_lostAetherflow = 0

	// First DWT should be rushed. Also used for end-of-fight rush
	_rushing = true

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.DREADWYRM_TRANCE.id,
		}, this._onRemoveDwt)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
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

	// -----
	// Event handling
	// -----
	_onCast(event) {
		const abilityId = event.ability.guid

		if (abilityId === ACTIONS.ENERGY_DRAIN.id || abilityId === ACTIONS.ENERGY_SIPHON.id) {
			// Energy Drain/Siphon restores up to 2 flow stacks
			// flow can never be > 2, so any remaining on cast is lost
			this._lostAetherflow += this._aetherflow
			this._aetherflow = MAX_AETHERFLOW
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

		if (abilityId === ACTIONS.DREADWYRM_TRANCE.id) {
			// DWT resets 3D
			this.cooldowns.resetCooldown(ACTIONS.TRI_DISASTER.id)
			const fightTimeRemaining = this.parser.fight.end_time - event.timestamp
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
