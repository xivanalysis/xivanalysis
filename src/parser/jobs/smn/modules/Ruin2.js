import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import {ActionLink} from 'components/ui/DbLink'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import PETS from 'data/PETS'

// Constants
// Unlike HW, don't need to worry about mana drain too much. It's just flat pot.
// TODO: Ok where is this gcd metadata gonna be stored at the end of the day?
//       ACTIONS is looking more and more tasty
// TODO: For full accuracy, each bad Ruin 2 needs to check for applied dots to
//       determine actual potency lost.  For simplicity, assume both dots are active
const RUIN2_POT = 160  //80 with no dots
const RUIN3_POT = 200  //100 with no dots

// Severity, in no. casts
const BAD_CAST_SEVERITY = {
	1: SEVERITY.MINOR,
	5: SEVERITY.MEDIUM,
	10: SEVERITY.MAJOR,
}

const CHECKED_RUIN_IDS = [
	ACTIONS.SMN_RUIN_II.id,
	ACTIONS.RUIN_IV.id,
]

export default class Ruin2 extends Module {
	static handle = 'ruin2'
	static dependencies = [
		'combatants',
		'gcd',
		'invuln',
		'pets',
		'suggestions',
	]

	// Events
	// TODO: Should probably mark bad R2s on the timeline in some capacity
	_warnings = []
	_issues = []

	// Tracking etc
	_lastOgcd = null
	_lastGcd = null
	_ogcdUsed = false
	_pos = {}

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	// Limiting to player, not worried about pets for this check
	_onCast(event) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)
		if (!action) { return }

		const lastGcdActionId = this._lastGcd
			? this._lastGcd.ability.guid
			: undefined

		if (!action.onGcd) {
			this._lastOgcd = event
			this._ogcdUsed = true
			return
		}

		// Calc the time in the GCD that the boss can't be targeted - R2ing before an invuln to prevent an R3 cancel is good
		const invulnTime = this.invuln.getUntargetableUptime(
			'all',
			event.timestamp,
			event.timestamp + this.gcd.getEstimate()
		)

		// TODO: GCD metadata should be in a module?
		// If there was no oGCD cast between the R2 and now, mark an issue
		if (
			action.onGcd &&
			CHECKED_RUIN_IDS.includes(lastGcdActionId) &&
			!this._ogcdUsed &&
			invulnTime === 0
		) {
			// If they at least moved, only raise a warning
			if (this.movedSinceLastGcd()) {
				this._warnings.push(this._lastGcd)
			} else {
				this._issues.push(this._lastGcd)
			}
		}

		// If this cast is on the gcd, store it for comparison
		this._lastGcd = event
		this._pos = this.combatants.selected.resources

		// If this is an R2 cast, track it
		if (CHECKED_RUIN_IDS.includes(action.id)) {
			// Explicitly setting the ogcd tracker to true while bahamut is out,
			// we don't want to fault people for using R2 for WWs during bahamut.
			this._ogcdUsed = (this.pets.getCurrentPet() === PETS.DEMI_BAHAMUT.id)
		}
	}

	// TODO: Should this be in some other module?
	movedSinceLastGcd() {
		return (
			Math.abs(this.combatants.selected.resources.x - this._pos.x) > 1 &&
			Math.abs(this.combatants.selected.resources.y - this._pos.y) > 1
		)
	}

	_onComplete() {
		const potLossPerR2 = RUIN3_POT - RUIN2_POT
		// It would be a waste to not use any stacks of Further Ruin left after the
		// last weave of the fight, so do not warn about them.
		const issues = this._issues.filter(cast => { return this.isNotEndOfFightRuin4(cast) }).length
		const warnings = this._warnings.filter(cast => { return this.isNotEndOfFightRuin4(cast) }).length

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.RUIN_III.icon,
			tiers: BAD_CAST_SEVERITY,
			value: issues,
			content: <Trans id="smn.ruin-ii.suggestions.issues.content">
				Prioritise casting <ActionLink {...ACTIONS.RUIN_III}/>. Casting <ActionLink {...ACTIONS.SMN_RUIN_II}/> or <ActionLink {...ACTIONS.RUIN_IV}/> is a DPS loss when not used to weave oGCDs or proc <ActionLink {...ACTIONS.WYRMWAVE}/>s.
				Unnecessary Ruin 4 casts will require an extra Ruin 2 cast for a future oGCD weave.
			</Trans>,
			why: <Trans id="smn.ruin-ii.suggestions.issues.why">
				{issues * potLossPerR2} potency lost to {issues} unnecessary Ruin II or Ruin IV
				<Plural value={issues} one="cast" other="casts"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SMN_RUIN_II.icon,
			content: <Trans id="smn.ruin-ii.suggestions.warnings.content">
				Unless significant movement is required, avoid using <ActionLink {...ACTIONS.SMN_RUIN_II}/> or <ActionLink {...ACTIONS.RUIN_IV}/> only for movement. Most position adjustments can be performed with slidecasting and the additional mobility available during <ActionLink {...ACTIONS.DREADWYRM_TRANCE}/>.
			</Trans>,
			why: <Trans id="smn.ruin-ii.suggestions.warnings.why">
				{warnings * potLossPerR2} potency lost to {warnings} Ruin II or Ruin IV
				<Plural value={warnings} one="cast" other="casts"/>
				used only to move.
			</Trans>,
			tiers: BAD_CAST_SEVERITY,
			value: warnings,
		}))
	}

	isNotEndOfFightRuin4(cast) {
		return cast.ability.guid === ACTIONS.SMN_RUIN_II.id || cast.timestamp < this._lastOgcd.timestamp
	}
}
