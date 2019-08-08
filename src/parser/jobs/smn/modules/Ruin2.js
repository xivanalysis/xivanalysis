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
const RUIN2_POT = 100
const RUIN3_POT = 120

// Severity, in no. casts
const BAD_CAST_SEVERITY = {
	1: SEVERITY.MINOR,
	5: SEVERITY.MEDIUM,
	10: SEVERITY.MAJOR,
}

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
	_all = []
	_warnings = []
	_issues = []

	// Tracking etc
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
			lastGcdActionId === ACTIONS.SMN_RUIN_II.id &&
			!this._ogcdUsed &&
			invulnTime === 0
		) {
			// If they at least moved, only raise a warning
			if (this.movedSinceLastGcd()) {
				this._warnings.push(event)
			} else {
				this._issues.push(event)
			}
		}

		// If this cast is on the gcd, store it for comparison
		this._lastGcd = event
		this._pos = this.combatants.selected.resources

		// If this is an R2 cast, track it
		if (action.id === ACTIONS.SMN_RUIN_II.id) {
			this._all.push(event)
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
		const issues = this._issues.length
		const warnings = this._warnings.length

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.RUIN_III.icon,
			tiers: BAD_CAST_SEVERITY,
			value: issues,
			content: <Trans id="smn.ruin-ii.suggestions.issues.content">
				<ActionLink {...ACTIONS.SMN_RUIN_II}/> is a DPS loss when not used to weave oGCDs or proc <ActionLink {...ACTIONS.WYRMWAVE}/>s. Prioritise casting <ActionLink {...ACTIONS.RUIN_III}/>.
			</Trans>,
			why: <Trans id="smn.ruin-ii.suggestions.issues.why">
				{issues * potLossPerR2} potency lost to {issues} unnecessary Ruin II
				<Plural value={issues} one="cast" other="casts"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SMN_RUIN_II.icon,
			content: <Trans id="smn.ruin-ii.suggestions.warnings.content">
				Unless significant movement is required, avoid using <ActionLink {...ACTIONS.SMN_RUIN_II}/> for movement. Most position adjustments can be performed with slidecasting and the additional mobility available during <ActionLink {...ACTIONS.DREADWYRM_TRANCE}/>.
			</Trans>,
			why: <Trans id="smn.ruin-ii.suggestions.warnings.why">
				{warnings * potLossPerR2} potency lost to {warnings} Ruin II
				<Plural value={warnings} one="cast" other="casts"/>
				used only to move.
			</Trans>,
			tiers: BAD_CAST_SEVERITY,
			value: warnings,
		}))
	}
}
