import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import Module from 'parser/core/Module'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'


export default class Basics extends Module {
	static handle = 'basics'
	static title = 'Basics'
	static dependencies = [
		'constants',
		'resources',
		'cooldowns',
		'suggestions',
	]
	// outward facing stances and resources
	_darkSideActive = false
	_gritActive = false
	_bloodWeaponActive = false
	_bloodPriceActive = false
	_inGCDCombo = true
	// -----
	// Accessors
	// -----
	darkSideActive() {
		return this._darkSideActive
	}
	gritActive() {
		return this._gritActive
	}
	bloodWeaponActive() {
		return this._bloodWeaponActive
	}
	bloodPriceActive() {
		return this._bloodPriceActive
	}
	inGCDCombo() {
		return this._inGCDCombo
	}

	// -----
	// Simulation
	// -----
	// gcd combo
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
		this.addHook('removebuff', {by: 'player'}, this._onRemoveBuff)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.GRIT.id}, this._onApplyGrit)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.DARKSIDE.id}, this._onApplyDarkside)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid
		// check for buffs
		if (abilityId === ACTIONS.BLOOD_WEAPON.id) {
			this._bloodWeaponActive = true
		}
		if (abilityId === ACTIONS.BLOOD_PRICE.id) {
			this._bloodPriceActive = true
		}
		// increment grit and bloodweapon bad tallies
		if (this.library.OFFENSIVE_ACTIONS.includes(abilityId)) {
			this._noDarksideActions += this._darkSideActive ? 0 : 1
			this._gritActions += this._gritActive ? 1 : 0
		}
		// check combo status
		if (this.library.GCD_COMBO_ACTIONS.includes(abilityId)) {
			if (this.library.GCD_COMBO_CHAIN.some(entry => entry.current === abilityId)) {
				const chainEntry = this.library.GCD_COMBO_CHAIN.find(entry => entry.current === abilityId)
				this._inGCDCombo = chainEntry.requires.includes(this._lastComboAction) && event.timestamp - this._lastComboGCDTimeStamp > this.library.GCD_COMBO_DURATION
			}
			this._lastComboAction = abilityId
			this._lastComboGCDTimeStamp = event.timestamp
		}
		// combo status check happened, can make GCD combo claims
		if (!this._inGCDCombo && abilityId.some(entry => entry.current === abilityId)) {
			this._lostGCDChainActions += 1
		}
	}
	_onApplyGrit() {
		this._gritActive = true
		this._bloodWeaponActive = false
	}
	_onApplyDarkside() {
		this._darkSideActive = true
	}
	_onRemoveBuff(event) {
		const statusId = event.status.guid
		if (statusId === STATUSES.DARKSIDE.id) {
			this._darkSideActive = false
		}
		if (statusId === STATUSES.GRIT.id) {
			this._gritActive = false
			this._bloodPriceActive = false
		}
		if (statusId === STATUSES.BLOOD_PRICE.id) {
			this._bloodPriceActive = false
		}
		if (statusId === STATUSES.BLOOD_WEAPON.id) {
			this._bloodWeaponActive = false
		}
	}

	_onDeath() {
		this._bloodPriceActive = false
		this._bloodWeaponActive = false
	}

	_onComplete() {
		//dark arts uptime
		//grit uptime
		//blood weapon uptime
		//dropped combo chain
	}
}
