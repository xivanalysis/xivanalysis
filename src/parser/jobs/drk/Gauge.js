import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import CORE from 'Core'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import CONSTANTS from './CONSTANTS'


export default class Gauge extends Module {
	static handle = 'gauge'
	static title = 'Blood Gauge'
	static dependencies = [
		'drk_core',
		'suggestions',
	]
	// main blood
	_currentBlood = 0
	_wastedBlood = 0
	_TBNlostBlood = 0
	// counters
	_countBloodWeapon = 0
	_countBloodPrice = 0
	_countDelirium = 0
	_countDeliriumBloodWeaponExtensions = 0
	_countDeliriumBloodPriceExtensions = 0
	_theBlackestNightQueue = []
	// blood price passive gain logic
	_owedBloodPriceBlood = false
	_timestampLastBloodPricePayout = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('applybuff', {abilityId: STATUSES.THE_BLACKEST_NIGHT.id, by: 'player'}, this._onApplyTheBlackestNight)
		this.addHook('removebuff', {abilityId: STATUSES.THE_BLACKEST_NIGHT.id, by: 'player'}, this._onRemoveTheBlackestNight)
		this.addHook('damage', {
			to: 'player',
			sourceIsFriendly: false,
			targetIsFriendly: true,
		}, this._onDamage)
		this.addHook('death', {to: 'player'}, this._onDeath())
	}

	_onCast(event) {
		const abilityId = event.ability.guid
		//resolve blood price passive gain before casting anything
		if (this._owedBloodPriceBlood) {
			// calcuate owed ticks
			const bloodModifier = Math.floor((event.timestamp - this._timestampLastBloodPricePayout) / CONSTANTS.BLOOD_PRICE_BLOOD_PASSIVE_RATE) * CONSTANTS.BLOOD_PRICE_BLOOD_PASSIVE_AMOUNT
			const newVals = CONSTANTS.bindValueToCeiling(this._currentBlood, bloodModifier, CONSTANTS.MAX_BLOOD)
			this._currentBlood = newVals.result
			this._wastedBlood += newVals.waste
		}
		if (abilityId === ACTIONS.BLOOD_WEAPON.id) {
			this._countBloodWeapon += 1
		}
		if (abilityId === ACTIONS.BLOOD_PRICE.id) {
			this._owedBloodPriceBlood = true
			this._timestampLastBloodPricePayout = event.timestamp
			this._countBloodPrice += 1
		}
		if (abilityId === ACTIONS.DELIRIUM.id) {
			this._countDelirium += 1
			if (CORE.bloodPriceActive) {
				this._countDeliriumBloodPriceExtensions += 1
			} else if (CORE.bloodWeaponActive) {
				this._countDeliriumBloodWeaponExtensions += 1
			}
		}
		if (CORE.bloodWeaponActive && CONSTANTS.BLOOD_WEAPON_GENERATORS.some(entry => entry.id === abilityId)) {
			const bloodModifier = CONSTANTS.BLOOD_WEAPON_GENERATORS.find(entry => entry.id === abilityId).blood
			const newVals = CONSTANTS.bindValueToCeiling(this._currentBlood, bloodModifier, CONSTANTS.MAX_BLOOD)
			this._currentBlood = newVals.result
			this._wastedBlood += newVals.waste
		}
		// drop combo if we failed combo, before we check if soul eater added blood
		if (CONSTANTS.GCD_COMBO_CHAIN.some(entry => entry.current === abilityId)) {
			if (!CORE.inGCDCombo) {
				//gcd chain was not respected, immediately exit out
				//this really only applies to soul eater, but it looks pretty
				return
			}
		}
		if (CONSTANTS.BLOOD_MODIFIERS.some(entry => entry.id === abilityId)) {
			const bloodModifier = CONSTANTS.BLOOD_MODIFIERS.find(entry => entry.id === abilityId).value
			const newVals = CONSTANTS.bindValueToCeiling(this._currentBlood, bloodModifier, CONSTANTS.MAX_BLOOD)
			this._currentBlood = newVals.result
			this._wastedBlood += newVals.waste
		}
	}

	_onDamage() {
  		if (CORE.bloodPriceActive) {
  			const bloodModifier = CONSTANTS.BLOOD_PRICE_BLOOD_DAMAGE_TRIGGERED_AMOUNT
			const newVals = CONSTANTS.bindValueToCeiling(this._currentBlood, bloodModifier, CONSTANTS.MAX_BLOOD)
			this._currentBlood = newVals.result
			this._wastedBlood += newVals.waste
		}
	}

	_onApplyTheBlackestNight(event) {
		this._theBlackestNightQueue.push(event.timestamp)
	}

	_onRemoveTheBlackestNight(event) {
		if (!this._theBlackestNightQueue.isEmpty()) {
			if (event.timestamp - CONSTANTS.THE_BLACKEST_NIGHT_DURATION < this._theBlackestNightQueue.shift()) {
				const newVals = CONSTANTS.bindValueToCeiling(this._currentBlood, CONSTANTS.THE_BLACKEST_NIGHT_BLOOD_CONDITIONAL_GENERATION, CONSTANTS.MAX_BLOOD)
				this._currentBlood = newVals.result
				this._wastedBlood = newVals.waste
			} else {
				this._TBNlostBlood += CONSTANTS.THE_BLACKEST_NIGHT_BLOOD_CONDITIONAL_GENERATION
			}
		}
	}

	_onDeath() {
		this._wastedBlood += this._currentBlood
		if (!this._theBlackestNightQueue.isEmpty()) {
			this._theBlackestNightQueue.length = 0
			this._TBNlostBlood += CONSTANTS.THE_BLACKEST_NIGHT_BLOOD_CONDITIONAL_GENERATION
		}
		this._currentBlood = 0
	}

	_onComplete() {
		//blood generation/waste/consumption
		//failed TBNs
	}
}
