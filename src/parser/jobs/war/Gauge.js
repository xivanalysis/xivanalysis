import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// General actions that generate Rage
const RAGE_GENERATORS = {
	[ACTIONS.MAIM.id]: 10,
	[ACTIONS.STORMS_EYE.id]: 10,
	[ACTIONS.SKULL_SUNDER.id]: 10,
	[ACTIONS.BUTCHERS_BLOCK.id]: 10,
	[ACTIONS.STORMS_PATH.id]: 20,
	[ACTIONS.INFURIATE.id]: 50,
}

//Actions that cost Rage
const RAGE_SPENDERS ={
	[ACTIONS.FELL_CLEAVE.id]: 50,
	[ACTIONS.INNER_BEAST.id]: 50,
	[ACTIONS.STEEL_CYCLONE.id]: 50,
	[ACTIONS.DECIMATE.id]: 50,
	[ACTIONS.UPHEAVAL.id]: 20,
	[ACTIONS.ONSLAUGHT.id]: 20,
}

const RAGE_USAGE_SEVERITY = {
	20: SEVERITY.MINOR,
	50: SEVERITY.MAJOR,
}

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

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid

		// THIS THING TOOK ME TOO LONG TO FIGURE OUT AND I LOST SOME OF MY HAIR BY THE END OF IT
		//On a serious note, it just checks for the ability, then adds the rage with the _addRage function, which, handles the waste etc.
		//The if below that is a check if the player is under inner release or not. If it is, the cost isn't subtracted from your current rage,
		//And simply treats it like they didn't cost rage at all. Elegant solution.
		if (RAGE_GENERATORS[abilityId]) {
			this._addRage(abilityId)
		}
		if (RAGE_SPENDERS[abilityId] && !this.combatants.selected.hasStatus(STATUSES.INNER_RELEASE.id)) {
			this._rage -= RAGE_SPENDERS[abilityId]
		}
	}

	_addRage(abilityId) {
		// Adds rage directly from the RAGE_GENERATOR object, using the abilityId handle.
		this._rage += RAGE_GENERATORS[abilityId]
		// Checks if _rage is going above MAX_RAGE, and adds it to waste, then returns if it is.
		if (this._rage > MAX_RAGE) {
			const waste = this._rage - MAX_RAGE
			this._wastedRage += waste
			this._rage = MAX_RAGE
			return waste
		}
		//Fix for gauge going negative, maybe?
		if (this._rage < 0) {
			this._rage = 0
		}
		return 0
	}

	_onDeath() {
		// Death just flat out resets everything. Stop dying.
		this._wastedRage += this._rage

		this._rage = 0
	}

	_onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.INFURIATE.icon,
			content: <Fragment>
					You used <ActionLink {...ACTIONS.STORMS_PATH}/>, <ActionLink {...ACTIONS.STORMS_EYE}/>, <ActionLink {...ACTIONS.INFURIATE}/>, or any gauge generators in a way that overcapped you.
			</Fragment>,
			why: <Fragment>
				{this._wastedRage} rage wasted by using abilities that put you over the cap.
			</Fragment>,
			tiers: RAGE_USAGE_SEVERITY,
			value: this._wastedRage,
		}))
	}
}
