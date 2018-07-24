import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// General actions that give Rage (this is how I'm referring to the Warrior gauge) -- Except Storm's Path, since it's a fringe case that gives +20 instead of 10.
const RAGE_GENERATORS = {
	[ACTIONS.MAIM.id]: 10,
	[ACTIONS.STORMS_EYE.id]: 10,
	[ACTIONS.SKULL_SUNDER.id]: 10,
	[ACTIONS.BUTCHERS_BLOCK.id]: 10,
	[ACTIONS.STORMS_PATH.id]: 20,
	[ACTIONS.INFURIATE.id]: 50,
}

const RAGE_SPENDERS ={
	[ACTIONS.FELL_CLEAVE.id]: 50,
	[ACTIONS.INNER_BEAST.id]: 50,
	[ACTIONS.STEEL_CYCLONE.id]: 50,
	[ACTIONS.DECIMATE.id]: 50,
	[ACTIONS.UPHEAVAL.id]: 20,
	[ACTIONS.ONSLAUGHT.id]: 20,
}

// Actions that reduce Infuriate's cooldown.
/*const INFURIATE_CD_ACTIONS = [
	ACTIONS.FELL_CLEAVE.id,
	ACTIONS.INNER_BEAST.id,
	ACTIONS.STEEL_CYCLONE.id,
	ACTIONS.DECIMATE.id,
]*/

// Max Rage
const MAX_RAGE = 100

export default class Gauge extends Module {
	static handle = 'gauge'
	static dependencies = [
		'combatants',
		'cooldowns',
		'suggestions',
	]

	// -----
	// Properties
	// -----
	// I'm assuming it'll start at 0 (which, in nine out of ten cases, should be it. I can't think of any fringe cases right now.)
	_rage = 0
	_wastedRage = 0
	_overallRageGained = 0

	_innerReleaseActive = false

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		/*this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.INNER_RELEASE.id,
		}, this._onRemoveInnerRelease)*/
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid

		if (RAGE_GENERATORS[abilityId]) {
			this._wastedRage += this._addRage(abilityId)
		}
		if (RAGE_SPENDERS[abilityId] && !this.combatants.selected.hasStatus(STATUSES.INNER_RELEASE.id)) {
			this._rage -= RAGE_SPENDERS[abilityId]
		}
	}

	_addRage(abilityId) {
		this._rage += RAGE_GENERATORS[abilityId]
		if (this._rage > MAX_RAGE) {
			const waste = this._rage - MAX_RAGE
			this._wastedRage += waste
			this._rage = MAX_RAGE
			return waste
		}
		return 0
	}

	_onDeath() {
		// Death just flat out resets everything. Stop dying.
		this._wastedRage += this._rage

		this._rage = 0
	}

	_onComplete() {
		if (this._wastedRage >= 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.INFURIATE.icon,
				content: <Fragment>
					You used <ActionLink {...ACTIONS.STORMS_PATH}/>, <ActionLink {...ACTIONS.STORMS_EYE}/>, <ActionLink {...ACTIONS.INFURIATE}/>, or any gauge generators in a way that overcapped you.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					You wasted {this._wastedRage} rage by using abilities that sent you over the cap.
				</Fragment>,
			}))
		}
	}
}
