import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// General actions that give Rage (this is how I'm referring to the Warrior gauge) -- Except Storm's Path, since it's a fringe case that gives +20 instead of 10.
const RAGE_ACTIONS = {
	[ACTIONS.MAIM.id]: 10,
	[ACTIONS.STORMS_EYE.id]: 10,
	[ACTIONS.SKULL_SUNDER.id]: 10,
	[ACTIONS.BUTCHERS_BLOCK.id]: 10,
	[ACTIONS.STORMS_PATH.id]: 20,
	[ACTIONS.INFURIATE.id]: 50,
}

// Actions that reduce Infuriate's cooldown.
const INFURIATE_CD_ACTIONS = [
	ACTIONS.FELL_CLEAVE.id,
	ACTIONS.INNER_BEAST.id,
	ACTIONS.STEEL_CYCLONE.id,
	ACTIONS.DECIMATE.id,
]

// Max Rage
const MAX_RAGE = 100

export default class Gauge extends Module {
	static handle = 'gauge'
	static dependencies = [
		'cooldowns',
		'suggestions',
	]

	// -----
	// Properties
	// -----
	// I'm assuming it'll start at 0 (which, in nine out of ten cases, should be it. I can't think of any fringe cases right now.)
	_rage = 0
	_wastedRage = 0
	_innerReleaseActive = false

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player', abilityId: Object.keys(RAGE_ACTIONS).map(key => parseInt(key, 10))}, this._onCast)
		/*		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.INNER_RELEASE.id,
		}, this._onRemoveInnerRelease)*/
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid

		const rageAbility = RAGE_ACTIONS[abilityId]
		//console.log(rageAbility)
		if (rageAbility != null) { this._rage += rageAbility }

		const wastedRage = this._rage - MAX_RAGE
		//console.log(wastedRage)
		if (wastedRage > 0) {
			this._wastedRage += wastedRage
			this._rage -= MAX_RAGE
			console.log(this._wastedRage)
			//console.log(this._rage)
		}

		if (INFURIATE_CD_ACTIONS.includes(abilityId)) {
			this.cooldowns.reduceCooldown(ACTIONS.INFURIATE.id, 5)
		}
	}

	/*	_onCast(event) {
		const abilityId = event.ability.guid

		if (abilityId === ACTIONS.INFURIATE.id && this._rage >= MAX_RAGE) {
			const finalRage = this._rage + 50
			this._wastedRage += finalRage - MAX_RAGE
			this._rage =- MAX_RAGE
		} else if (abilityId === ACTIONS.INFURIATE.id) {
			this._rage += 50
		}

		if (RAGE_ACTIONS.includes(abilityId) && this._rage >= MAX_RAGE) {
			const finalRage = this._rage + 10
			this._wastedRage += finalRage - MAX_RAGE
			this._rage =- MAX_RAGE
		} else if (RAGE_ACTIONS.includes(abilityId)) {
			this._rage += 10
		}

		if (abilityId === ACTIONS.STORMS_PATH.id && this._rage >= MAX_RAGE) {
			const finalRage = this._rage + 20
			this._wastedRage += finalRage - MAX_RAGE
			this._rage =- MAX_RAGE
		} else if (abilityId === ACTIONS.STORMS_PATH.ID) {
			this._rage+= 20
		}

		if (INFURIATE_CD_ACTIONS.includes(abilityId)) {
			this.cooldowns.reduceCooldown(ACTIONS.INFURIATE.id, 5)
		}
	}*/

	_onDeath() {
		// Death just flat out resets everything. Stop dying.
		this._wastedRage += this._rage

		this._rage = 0
	}

	_onComplete() {
		if (this._wastedRage >= 50) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.INFURIATE.icon,
				content: <Fragment>
					You used <ActionLink {...ACTIONS.STORMS_PATH}/>, <ActionLink {...ACTIONS.STORMS_EYE}/>, <ActionLink {...ACTIONS.INFURIATE}/>, or any gauge generators in a way that overcapped you.
					And you lost at least one Fell Cleave due to it.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					You wasted {this._wastedRage} rage by using abilities that overcapped your gauge.
				</Fragment>,
			}))
		}
	}
}
