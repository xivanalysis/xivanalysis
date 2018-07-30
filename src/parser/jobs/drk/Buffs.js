import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import Module from 'parser/core/Module'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

export default class Buffs extends Module {
	static handle = 'buffs'
	static title = 'Buffs and Stances'
	static dependencies = [
		'library',
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
	darkArtsActive() {
		return this.combatants.selected.hasStatus(STATUSES.DARK_ARTS.id)
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
		// cleanup
		this._gritToggleStack.push({timestamp: event.timestamp, active: false})
		this._darksideToggleStack.push({timestamp: event.timestamp, active: false})
		this._bloodWeaponTriggerStack.push({timestamp: event.timestamp, active: false})
		this._bloodPriceTriggerStack.push({timestamp: event.timestamp, active: false})
		// -----
		// UI Component
		// -----
		//calculating fight duration this way gives absurd downtime values for some parses.  Just using the raw values since the core bloodwep function has a lot of leeway anyways.
		const rawFightDuration = this.parser.fightDuration
		const fightDuration = this.parser.fightDuration - this.downtime.getDowntime()
		//15 seconds every 40 seconds, 8 seconds every 80 seconds.
		//the +20 seconds for the downtime buffer seems to make this pretty accurate for some reason.  Find a better fix in the future once fight downtime detection segmenting is super accurate.
		const optimalFightBloodWeaponDuration = (Math.floor(fightDuration / 40000) * 15000) + (Math.floor(fightDuration / 80000) * 8000) + (Math.floor(((rawFightDuration - fightDuration) + 20000) / 40000) * 15000)
		const fightBloodWeaponDuration = Buffs._parseEventStack(this._bloodWeaponTriggerStack)
		const fightDarksideDuration = Buffs._parseEventStack(this._darksideToggleStack)
		const fightGritDuration = Buffs._parseEventStack(this._gritToggleStack)
		//later, use the blood price application times to check if blood weapon windows were missed
		//darkside uptime
		//grit uptime
		//blood weapon uptime
		this.checklist.add(new Rule({
			name: <Fragment><ActionLink {...ACTIONS.DARKSIDE}/></Fragment>,
			description: 'Darkside should only be removed during downtime, to allow for mana to be regained.  This meter is normalized against simulated fight downtime; anything above 97% is effectively 100% due to' +
				'how FFLogs handles darkside refreshing itself, and values are capped to 100% due to simulator inaccuracies.',
			requirements: [
				new Requirement({
					name: 'Darkside Total Uptime',
					percent: this.library.upperCap(((fightDarksideDuration / fightDuration) * 100), 100),
				}),
			],
		}))
		this.checklist.add(new Rule({
			name: <Fragment><ActionLink {...ACTIONS.BLOOD_WEAPON}/></Fragment>,
			description: <Fragment>As your primary blood generation tool, keeping blood weapon up as much as possible is a fundamental part of your damage.  <ActionLink {...ACTIONS.DELIRIUM}/>
				with an 8 second refresh and raw duration vs cooldown let you have an ideal dummy uptime of 47.5%, with changes per fight based on downtime and length. </Fragment>,
			requirements: [
				new Requirement({
					name: 'Blood Weapon Normalized Uptime',
					percent: this.library.upperCap((fightBloodWeaponDuration / optimalFightBloodWeaponDuration) * 100, 100),
				}),
			],
		}))
		this.checklist.add(new Rule({
			name: <Fragment>No <ActionLink {...ACTIONS.GRIT}/></Fragment>,
			description: <Fragment>As a powerful defensive cooldown and enmity tool, grit will have to be used in specific parts of the fight.  By using strong defensive cooldowns more often like
				<ActionLink {...ACTIONS.SHADOW_WALL}/> or spending <ActionLink {...ACTIONS.DARK_ARTS}/> for a higher enmity bonus on <ActionLink {...ACTIONS.PLUNGE}/>,<ActionLink {...ACTIONS.DARK_PASSENGER}/>,<ActionLink {...ACTIONS.SPINNING_SLASH}/>, or <ActionLink {...ACTIONS.POWER_SLASH}/>, you can greatly reduce time spent in grit to directly increase damage.</Fragment>,
			requirements: [
				new Requirement({
					name: 'Fight Spent without Grit',
					percent:  this.library.upperCap((100 - ((fightGritDuration / fightDuration) * 100)), 100),
				}),
			],
		}))
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
		return false
	}
}
