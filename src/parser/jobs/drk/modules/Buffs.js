import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import Module from 'parser/core/Module'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

/* CURRENTLY UNUSED. FUTURE IMPROVEMENT
// Things that should eventually get flagged if they show up under grit and darkside
// Later on, this should be a map of potency loss and hate bonus
const OFFENSIVE_ACTIONS = [
	//gcd
	//combo
	ACTIONS.HARD_SLASH.id,
	ACTIONS.SYPHON_STRIKE.id,
	ACTIONS.SOULEATER.id,
	ACTIONS.SPINNING_SLASH.id,
	ACTIONS.POWER_SLASH.id,
	//blood
	ACTIONS.BLOODSPILLER.id,
	ACTIONS.QUIETUS.id,
	//non combo
	ACTIONS.UNLEASH.id,
	ACTIONS.UNMEND.id,
	ACTIONS.ABYSSAL_DRAIN.id,
	//ogcd
	ACTIONS.PLUNGE.id,
	ACTIONS.CARVE_AND_SPIT.id,
	ACTIONS.DARK_PASSENGER.id,
	ACTIONS.SALTED_EARTH.id,
]
*/

export default class Buffs extends Module {
	static handle = 'buffs'
	static title = 'Buffs and Stances'
	static dependencies = [
		'downtime',
		'combatants',
		'downtime',
		'checklist',
	]
	// -----
	// Accessors
	// -----
	// this entire block used to have more logic to handle TBN and some weird blood weapon cases,
	// but ended up just getting simplified.  Probably will be expanded upon later.
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
	darkArtsActive() {
		return this.combatants.selected.hasStatus(STATUSES.DARK_ARTS.id)
	}

	// -----
	// Evaluation Metrics
	// -----
	// stack object: {timestamp: int, overwrite: boolean, duration: int}
	// trigger implies a refreshbuff is relevant, toggle does not
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

	_onComplete(event) {
		// cleanup
		this._gritToggleStack.push({timestamp: event.timestamp, active: false})
		this._darksideToggleStack.push({timestamp: event.timestamp, active: false})
		this._bloodWeaponTriggerStack.push({timestamp: event.timestamp, active: false})
		this._bloodPriceTriggerStack.push({timestamp: event.timestamp, active: false})
		// -----
		// UI Component
		// -----
		// Math Constants
		const BLOOD_WEAPON_COOLDOWN = 40000
		const BLOOD_WEAPON_DURATION = 15000
		const DELIRIUM_COOLDOWN = 80000
		const DELIRIUM_BLOOD_WEAPON_EXTENSION = 8000
		//using only duration or fightduration ends up with weird results.  mixture of both has worked really well in near-matching fflogs
		const rawFightDuration = this.parser.fightDuration
		const fightDuration = this.parser.fightDuration - this.downtime.getDowntime()
		//15 seconds every 40 seconds (BW), 8 seconds every 80 seconds (del).
		//the +20 seconds for the downtime buffer (half blood wep CD) seems to make this pretty accurate for some reason.  Find a better fix in the future once fight downtime detection segmenting is super accurate.
		// or at least when it doesn't consider a DRK running off to LD second wind in o6s as downtime.
		const optimalFightBloodWeaponDuration =
			(Math.floor(rawFightDuration / BLOOD_WEAPON_COOLDOWN) * BLOOD_WEAPON_DURATION) + //raw blood wep
			(Math.floor(rawFightDuration / DELIRIUM_COOLDOWN) * DELIRIUM_BLOOD_WEAPON_EXTENSION) + //raw delirium
			(Math.floor(((rawFightDuration - fightDuration) + (BLOOD_WEAPON_COOLDOWN / 1.5)) / BLOOD_WEAPON_COOLDOWN) * BLOOD_WEAPON_DURATION) //corrective factor
		const fightBloodWeaponDuration = Buffs._parseEventStack(this._bloodWeaponTriggerStack)
		const fightDarksideDuration = Buffs._parseEventStack(this._darksideToggleStack)
		const fightGritDuration = Buffs._parseEventStack(this._gritToggleStack)
		//later, use the blood price application times to check if blood weapon windows were missed, but not really needed for core functionality
		this.checklist.add(new Rule({
			name: <Fragment><ActionLink {...ACTIONS.DARKSIDE}/></Fragment>,
			description: 'Darkside should only be removed during downtime natural mana regeneration.',
			requirements: [
				new Requirement({
					name: 'Darkside Total Uptime',
					//up to 3% of the fight's darkside gets lost by fflogs because of it being a buff that gets refreshed instead of a stance. :)
					percent: Math.min(((fightDarksideDuration / rawFightDuration) * 100) + 3, 100),
				}),
			],
		}))
		this.checklist.add(new Rule({
			name: <Fragment><ActionLink {...ACTIONS.BLOOD_WEAPON}/></Fragment>,
			description: <Fragment>As your primary blood generation and damage tool, keeping blood weapon up as much as possible is a fundamental part of your damage.  <ActionLink {...ACTIONS.DELIRIUM}/>
				and a 15s natural cooldown allow for striking dummy uptime of 47.5%, with changes per fight based on downtime and length.  This value is pre-corrected, aim for at least 95%.</Fragment>,
			requirements: [
				new Requirement({
					name: 'Blood Weapon Normalized Uptime',
					percent: Math.min((fightBloodWeaponDuration / optimalFightBloodWeaponDuration) * 100, 100),
				}),
			],
		}))
		this.checklist.add(new Rule({
			name: <Fragment>No <ActionLink {...ACTIONS.GRIT}/></Fragment>,
			description: <Fragment>Grit is required for enmity openers and some points of excessive damage, but drastically reduces damage output.</Fragment>,
			requirements: [
				new Requirement({
					name: 'Fight Spent without Grit',
					percent:  Math.min((100 - ((fightGritDuration / fightDuration) * 100)), 100),
				}),
			],
		}))
	}

	output() {
		return false
	}
}
