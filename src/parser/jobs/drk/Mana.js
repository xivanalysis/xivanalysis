import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import CONSTANTS from './CONSTANTS'
import CORE from './Core'


export default class Mana extends Module {
	static handle = 'mana'
	static title = 'Mana Management'
	static dependencies = [
		'drk_core',
		'suggestions',
	]

	_currentMana = CONSTANTS.MAX_MANA
	_wastedMana = 0
	// counters (uncombo'd GCDs ignored)
	_countDA = 0 // Dark Arts
	_countDroppedDA = 0 //dropped dark arts
	_countCSnoDA = 0 // Carve and Spit, without DA (350 potency loss)
	_countDAPS = 0  // Dark Arts Power Slash    (3 in hate chain, better hate mod than 2).
	_countDASS = 0  // Dark Arts Spinning Slash (2 in hate chain)
	_countDADP = 0  // Dark Arts Dark Passenger (no slashing bonus, slightly worse than DA other abilities)
	// dark arts
	_darkArtsOn = true
	_darkArtsApplicationTime = -1
	// flags
	_darkArtsOpener = false

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.DARK_ARTS.id}, this._onApplyDarkArts)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.DARK_ARTS.id}, this._onRemoveDarkArts)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid
		// drop if we failed combo, before we check if syphon strike added mana
		if (CONSTANTS.GCD_COMBO_CHAIN.some(entry => entry.current === abilityId)) {
			if (!CORE.inGCDCombo) {
				//gcd chain was not respected, immediately exit out
				//this really only applies to syphon strike, but it looks pretty
				return
			}
		}
		if (CONSTANTS.MANA_MODIFIERS.some(entry => entry.id === abilityId)) {
			const manaModifier = CONSTANTS.MANA_MODIFIERS.find(entry => entry.id === abilityId).value
			const newVals = CONSTANTS.bindValueToCeiling(this._currentMana, manaModifier, CONSTANTS.MAX_MANA)
			this._currentMana = newVals.result
			this._wastedMana += newVals.waste
		}
		if (CONSTANTS.GRIT_GENERATORS.some(entry => entry.id === abilityId)) {
			const manaModifier = CONSTANTS.MANA_MODIFIERS.find(entry => entry.id === abilityId).mana
			const newVals = CONSTANTS.bindValueToCeiling(this._currentMana, manaModifier, CONSTANTS.MAX_MANA)
			this._currentMana = newVals.result
			this._wastedMana += newVals.waste
		}
		if (this._darkArtsOn && CONSTANTS.DARK_ARTS_CONSUMERS.includes(abilityId)) {
			// DA will be consumed and resolved, manually increment targeted counters
			if (abilityId === ACTIONS.DARK_PASSENGER.id) {
				this._countDADP += 1
			}
			if (abilityId === ACTIONS.SPINNING_SLASH.id) {
				this._countDASS += 1
			}
			if (abilityId === ACTIONS.POWER_SLASH.id) {
				this._countDAPS += 1
			}
		}
		// final check to see if we just CS'd without DA up
		if ((!this._darkArtsOn) && abilityId === ACTIONS.CARVE_AND_SPIT) {
			this._countCSnoDA += 1
		}
	}

	_onApplyDarkArts(event) {
		if (event.timestamp === this.parser.fight.start_time) {
			//opener DA put in with a fabricated event
			this._darkArtsOpener = true
		}
		this._countDA += 1
		this._darkArtsApplicationTime = event.timestamp
	}

	_onRemoveDarkArts(event) {
		// remove DA status
		this._darkArtsOn = false
		// check if DA was consumed by an action, increment DA tally if so
		if (this._darkArtsApplicationTime - event.timestamp > CONSTANTS.DARK_ARTS_DURATION) {
			// DA was consumed
			this._countDA += 1
		} else {
			// buff fell off
			this._countDroppedDA += 1
		}
	}

	_onDeath() {
		this._wastedMana += this._currentMana
		this._currentMana = 0
	}

	_onComplete() {
		// DA opener
		// wasted DA uses
		// wasted mana
		// better spent enmity DAPSvsDASS
		// carve and spit without DA
	}
}
