import {Plural, Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import PETS from 'data/PETS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {getDataBy} from 'data'
import {DEMI_SUMMON_LENGTH} from './Pets'

const AETHER_ACTIONS = [
	ACTIONS.FESTER.id,
	ACTIONS.PAINFLARE.id,
]

const MAX_AETHERFLOW = 2
const DREADWYRM_TRANCE_DURATION = 16000
const MIN_DWT_BUILD = DREADWYRM_TRANCE_DURATION + (ACTIONS.FESTER.cooldown * 1000) * 2

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
	_dreadwyrmAether = 0

	// Track lost stacks
	_lostAetherflow = 0
	_lostDreadwyrmAether = 0

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

			// (Should be) rushing if it's the last flow of the fight, and there won't be enough time for a full rotation.
			// Need ~26s for a proper DWT, plus at least another 20 if SB would be up.
			let reqRotationTime = MIN_DWT_BUILD
			if (this._dreadwyrmAether >= 1) {
				reqRotationTime += DEMI_SUMMON_LENGTH
			}

			const fightTimeRemaining = this.parser.fight.end_time - event.timestamp
			this._rushing = reqRotationTime >= fightTimeRemaining
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
		}

		if (abilityId === ACTIONS.SUMMON_BAHAMUT.id) {
			// Summon Bahamut spends both dwa
			// TODO: Check for use when <2 dwa (logic issue)
			this._dreadwyrmAether = 0
		}
	}

	_onRemoveDwt(event) {
		// The end of DWT (either DF or natural falloff) bestows 1 dwa, max 2.
		if (this._dreadwyrmAether === 2) {
			this._lostDreadwyrmAether ++
		} else {
			this._dreadwyrmAether ++
		}

		// If they've got bahamut ready, but won't have enough time in the fight to effectively use him, they're rushing.
		const cdRemaining = this.cooldowns.getCooldownRemaining(ACTIONS.AETHERFLOW.id)
		const fightTimeRemaining = this.parser.fight.end_time - event.timestamp
		if (this._dreadwyrmAether === 2 && fightTimeRemaining < cdRemaining + DEMI_SUMMON_LENGTH) {
			this._rushing = true
		}
	}

	_onDeath() {
		// Death just flat out resets everything. Rip.
		// Not counting the loss towards the rest of the gauge loss, that'll just double up on the suggestions
		this._aetherflow = 0
		this._dreadwyrmAether = 0
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

		if (this._lostDreadwyrmAether) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SUMMON_BAHAMUT.icon,
				content: <Trans id="smn.gauge.suggestions.lost-dreadwyrm-aether.content">
					Ensure you always <ActionLink {...ACTIONS.SUMMON_BAHAMUT}/> before your next <ActionLink {...ACTIONS.DREADWYRM_TRANCE}/>. Failing to do so will de-sync Bahamut in your rotation, and potentially lose you a summon over the duration of the fight.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="smn.gauge.suggestions.lost-dreadwyrm-aether.why">
					<Plural value={this._lostDreadwyrmAether} one="# stack" other="# stacks"/>
					of Dreadwyrm Aether lost.
				</Trans>,
			}))
		}
	}
}
