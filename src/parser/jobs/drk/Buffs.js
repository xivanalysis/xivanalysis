//import React, {Fragment} from 'react'

//import {ActionLink} from 'components/ui/DbLink'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import Module from 'parser/core/Module'
//import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

export default class Buffs extends Module {
	static handle = 'buffs'
	static title = 'Buffs and Stances'
	static dependencies = [
		'library',
		'resources',
		'downtime',
		'cooldowns',
		'combatants',
		'downtime',
		'checklist',
		'suggestions',
	]
	// -----
	// Accessors
	// -----
	darkSideActive() {
		return this.combatants.selected.hasStatus(STATUSES.DARKSIDE.id)
	}
	gritActive() {
		return this.combatants.selected.hasStatus(STATUSES.GRIT.id)
	}
	bloodWeaponActive() {
		return this.combatants.selected.hasStatus(STATUSES.BLOOD_WEAPON.id)
	}
	bloodPriceActive() {
		return this.combatants.selected.hasStatus(STATUSES.BLOOD_PRICE.id)
	}

	// -----
	// Evaluation Metrics
	// -----
	// stack object: {timestamp: int, overwrite: boolean, duration: int}
	_gritToggleStack = []
	_darksideToggleStack = []
	_bloodWeaponTriggerStack = []
	_bloodPriceTriggerStack = []

	constructor(...args) {
		super(...args)
		this.addHook(['applybuff', 'refreshbuff', 'removebuff'], {by: 'player', abilityId: STATUSES.BLOOD_WEAPON.id}, this._modifyBloodWeapon)
		this.addHook(['applybuff', 'refreshbuff', 'removebuff'], {by: 'player', abilityId: STATUSES.BLOOD_PRICE.id}, this._modifyBloodPrice)
		this.addHook(['applybuff', 'removebuff'], {by: 'player', abilityId: STATUSES.GRIT.id}, this._modifyGrit)
		this.addHook(['applybuff', 'removebuff'], {by: 'player', abilityId: STATUSES.DARKSIDE.id}, this._modifyDarkside)
		this.addHook('complete', this._onComplete)
	}

	_modifyBloodWeapon(event) {
		if (event.type === 'applybuff') {
			this._bloodWeaponTriggerStack.push({timestamp: event.timestamp, active: true})
		} else if (event.type === 'removebuff') {
			this._bloodWeaponTriggerStack.push({timestamp: event.timestamp, active: false})
		}
	}
	_modifyBloodPrice(event) {
		if (event.type === 'applybuff') {
			this._bloodPriceTriggerStack.push({timestamp: event.timestamp, active: true})
		} else if (event.type === 'removebuff') {
			this._bloodPriceTriggerStack.push({timestamp: event.timestamp, active: false})
		}
	}
	_modifyDarkside(event) {
		if (event.type === 'applybuff') {
			this._darksideToggleStack.push({timestamp: event.timestamp, active: true})
		} else if (event.type === 'removebuff') {
			this._darksideToggleStack.push({timestamp: event.timestamp, active: false})
		}
	}
	_modifyGrit(event) {
		if (event.type === 'applybuff') {
			this._gritToggleStack.push({timestamp: event.timestamp, active: true})
		} else if (event.type === 'removebuff') {
			this._gritToggleStack.push({timestamp: event.timestamp, overwrite: true, duration: 0})
		}
	}

	_onComplete(event) {
		this._gritToggleStack.push({timestamp: event.timestamp, active: false})
		this._darksideToggleStack.push({timestamp: event.timestamp, active: false})
		this._bloodWeaponTriggerStack.push({timestamp: event.timestamp, active: false})
		this._bloodPriceTriggerStack.push({timestamp: event.timestamp, active: false})
	}

	static _parseEventStack(stack) {
		let out = 0
		let previous_entry = undefined
		while (stack.length !== 0) {
			const entry = stack.shift()
			if (!entry.active && previous_entry !== undefined && previous_entry.active) {
				out += entry.timestamp - previous_entry.timestamp
			}
			previous_entry = entry
		}
		return out
	}

	output() {
		//calculating fight duration this way gives absurd downtime values for some parses.  Just using the raw values since the core bloodwep function has a lot of leeway anyways.
		const rawFightDuration = this.parser.fightDuration
		const fightDuration = this.parser.fightDuration - this.downtime.getDowntime()
		//15 seconds every 40 seconds, 8 seconds every 80 seconds. 15+15+8 = 38/80
		const optimalFightBloodWeaponDuration = (Math.floor(rawFightDuration / 40000) * 15000) + (Math.floor(rawFightDuration / 80000) * 8000)
		const fightBloodWeaponDuration = Buffs._parseEventStack(this._bloodWeaponTriggerStack)
		const fightDarksideDuration = Buffs._parseEventStack(this._darksideToggleStack)
		const fightGritDuration = Buffs._parseEventStack(this._gritToggleStack)
		//later, use the blood price application times to check if blood weapon windows were missed
		//darkside uptime
		//grit uptime
		//blood weapon uptime
		this.checklist.add(new Rule({
			name: 'Darkside',
			description: 'Darkside should only be removed during long transitions, to allow for mana to be regained.  This meter is normalized against fight downtime; anything above 97% is effectively 100% due to' +
				'how FFLogs handles darkside refreshing itself.',
			requirements: [
				new Requirement({
					name: 'Darkside Total Uptime',
					percent: (fightDarksideDuration / rawFightDuration) * 100,
				}),
			],
		}))
		this.checklist.add(new Rule({
			name: 'Blood Weapon',
			description: 'As your primary blood generation tool, keeping blood weapon up as much as possible is a fundamental part of your damage.  Delirium refreshes and raw duration let you have an ideal ' +
				'uptime of 47.5%, though this number will vary fight to fight.',
			requirements: [
				new Requirement({
					name: 'Blood Weapon Normalized Uptime',
					percent: (fightBloodWeaponDuration / optimalFightBloodWeaponDuration) * 100,
				}),
			],
		}))
		this.checklist.add(new Rule({
			name: 'Gritless',
			description: 'As a powerful defensive cooldown and enmity tool, grit will have to be used in specific parts of the fight.  Working on lowering the time spent in grit will directly increase damage.',
			requirements: [
				new Requirement({
					name: 'Fight Spent without Grit',
					percent:  fightGritDuration === 0 ? 100 : (fightGritDuration / fightDuration) * 100,
				}),
			],
		}))
		return false
	}
}
