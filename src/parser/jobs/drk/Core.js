import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import Module from 'parser/core/Module'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import CONSTANTS from './CONSTANTS'


export default class Core extends Module {
	static handle = 'drk_core'
	static title = 'Basics'
	static dependencies = [
		'cooldowns',
		'suggestions',
	]
	// outward facing stances
	static darkSideActive = false
	static gritActive = false
	static bloodWeaponActive = false
	static bloodPriceActive = false
	static inGCDCombo = true

	// -----
	// Simulation
	// -----
	//gcd combo
	_lastComboAction = undefined
	_lastComboGCDTimeStamp = -1
	_lostGCDChainActions = 0
	// -----
	// Evaluation Metrics
	// -----
	_gritActions = 0
	_noDarksideActions = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('removebuff', {by: 'player'}, Core._onRemoveBuff)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.GRIT.id}, Core._onApplyGrit)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.DARKSIDE.id}, Core._onApplyDarkside)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid
		// check for buffs
		if (abilityId === ACTIONS.BLOOD_WEAPON.id) {
			Core.bloodWeaponActive = true
		}
		if (abilityId === ACTIONS.BLOOD_PRICE.id) {
			Core.bloodPriceActive = true
		}
		// increment grit and bloodweapon bad tallies
		if (CONSTANTS.OFFENSIVE_ACTIONS.includes(abilityId)) {
			this._noDarksideActions += Core.darkSideActive ? 0 : 1
			this._gritActions += Core.gritActive ? 1 : 0
		}
		// check combo status
		if (CONSTANTS.GCD_COMBO_ACTIONS.includes(abilityId)) {
			if (CONSTANTS.GCD_COMBO_CHAIN.some(entry => entry.current === abilityId)) {
				const chainEntry = CONSTANTS.GCD_COMBO_CHAIN.find(entry => entry.current === abilityId)
				Core.inGCDCombo = chainEntry.requires.includes(this._lastComboAction) && event.timestamp - this._lastComboGCDTimeStamp > CONSTANTS.GCD_COMBO_DURATION
			}
			this._lastComboAction = abilityId
			this._lastComboGCDTimeStamp = event.timestamp
		}
		// combo status check happened, can make GCD combo claims
		if (!Core.inGCDCombo && abilityId.some(entry => entry.current === abilityId)) {
			this._lostGCDChainActions += 1
		}
	}
	static _onApplyGrit() {
		Core.gritActive = true
		Core.bloodWeaponActive = false
	}
	static _onApplyDarkside() {
		Core.darkSideActive = true
	}
	static _onRemoveBuff(event) {
		const statusId = event.status.guid
		if (statusId === STATUSES.DARKSIDE.id) {
			Core.darkSideActive = false
		}
		if (statusId === STATUSES.GRIT.id) {
			Core.gritActive = false
			Core.bloodPriceActive = false
		}
		if (statusId === STATUSES.BLOOD_PRICE.id) {
			Core.bloodPriceActive = false
		}
		if (statusId === STATUSES.BLOOD_WEAPON.id) {
			Core.bloodWeaponActive = false
		}
	}

	_onDeath(event) {
		//TODO
	}
}
