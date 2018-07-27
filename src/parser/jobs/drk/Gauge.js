import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import Module from 'parser/core/Module'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'


export default class Gauge extends Module {
	static handle = 'gauge'
	static title = 'Blood Management'
	static dependencies = [
		'library',
		'resources',
		'basics',
		'cooldowns',
		'suggestions',
	]
	// main blood
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
			this.resources.modifyBlood(Math.floor((event.timestamp - this._timestampLastBloodPricePayout) / this.library.BLOOD_PRICE_BLOOD_PASSIVE_RATE) * this.library.BLOOD_PRICE_BLOOD_PASSIVE_AMOUNT)
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
			if (this.basics.bloodPriceActive()) {
				this._countDeliriumBloodPriceExtensions += 1
			} else if (this.basics.bloodWeaponActive()) {
				this._countDeliriumBloodWeaponExtensions += 1
			}
		}
		if (this.basics.bloodWeaponActive && this.library.BLOOD_WEAPON_GENERATORS.some(entry => entry.id === abilityId)) {
			this.resources.modifyBlood(this.library.BLOOD_WEAPON_GENERATORS.find(entry => entry.id === abilityId).blood)
		}
		// drop combo if we failed combo, before we check if soul eater added blood
		if (this.library.GCD_COMBO_CHAIN.some(entry => entry.current === abilityId)) {
			if (!this.basics.inGCDCombo) {
				//gcd chain was not respected, immediately exit out
				//this really only applies to soul eater, but it looks pretty
				return
			}
		}
		if (this.library.BLOOD_MODIFIERS.some(entry => entry.id === abilityId)) {
			this.resources.modifyBlood(this.library.BLOOD_MODIFIERS.find(entry => entry.id === abilityId).value)
		}
	}

	_onDamage() {
		if (this.basics.bloodPriceActive) {
			this.resources.modifyBlood(this.library.BLOOD_PRICE_BLOOD_DAMAGE_TRIGGERED_AMOUNT)
		}
	}

	_onApplyTheBlackestNight(event) {
		this._theBlackestNightQueue.push(event.timestamp)
	}

	_onRemoveTheBlackestNight(event) {
		if (!this._theBlackestNightQueue.isEmpty()) {
			if (event.timestamp - this.library.THE_BLACKEST_NIGHT_DURATION < this._theBlackestNightQueue.shift()) {
				this.resources.modifyBlood(this.library.THE_BLACKEST_NIGHT_BLOOD_CONDITIONAL_GENERATION)
			} else {
				this._TBNlostBlood += this.library.THE_BLACKEST_NIGHT_BLOOD_CONDITIONAL_GENERATION
			}
		}
	}

	_onDeath() {
		if (!this._theBlackestNightQueue.isEmpty()) {
			this._theBlackestNightQueue.length = 0
			this._TBNlostBlood += this.library.THE_BLACKEST_NIGHT_BLOOD_CONDITIONAL_GENERATION
		}
	}

	_onComplete() {
		//failed TBNs
		//expand on lost blood/potency from previous blood analysis
		//expand on bloodweapon uptime with delirium usage
	}
}
