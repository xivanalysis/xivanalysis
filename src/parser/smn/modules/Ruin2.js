import React, { Fragment } from 'react'

import Module from 'parser/core/Module'
import ACTIONS from 'data/ACTIONS'

import { ActionLink } from 'components/ui/DbLink'

export default class Ruin2 extends Module {
	static dependencies = [
		'combatant',
		'gauge'
	]

	name = 'Ruin 2'

	// Constants
	// Unlike HW, don't need to worry about mana drain too much. It's just flat pot
	// TODO: Ok where is this gcd metadata gonna be stored at the end of the day?
	//       ACTIONS is looking more and more tasty
	RUIN2_POT = 100
	RUIN3_POT = 120

	// Events
	// TODO: If (when) I set up the timeline, should probably mark bad R2s on it
	all = []
	warnings = []
	issues = []

	// Tracking etc
	lastGcd = null
	ogcdUsed = false
	pos = {}

	// Limiting to player, not worried about pets for this check
	on_cast_byPlayer(event) {
		// TODO: should move action lookup into an export from ACTIONS with fallback handling or something
		const action = ACTIONS[event.ability.guid] || {}
		const lastGcdAction = (this.lastGcd && ACTIONS[this.lastGcd.ability.guid]) || {}

		// TODO: GCD metadata should be in a module?
		// If there was no oGCD cast between the R2 and now, mark an issue
		if (
			action.onGcd &&
			lastGcdAction.id === ACTIONS.RUIN_II.id &&
			!this.ogcdUsed
		) {
			// If they at least moved, only raise a warning
			if (this.movedSinceLastGcd()) {
				this.warnings.push(event)
			} else {
				this.issues.push(event)
			}
		}

		if (action.onGcd) {
			// If this cast is on the gcd, store it for comparison
			this.lastGcd = event
			this.pos = this.combatant.resources
		} else {
			// Otherwise take note that they've used an oGCD
			this.ogcdUsed = true
		}

		// If this is an R2 cast, track it
		if (action.id === ACTIONS.RUIN_II.id) {
			this.all.push(event)
			// Explicitly setting the ogcd tracker to true while bahamut is out,
			// we don't want to fault people for using R2 for WWs during bahamut.
			this.ogcdUsed = this.gauge.bahamutSummoned()
		}
	}

	// TODO: Should this be in some other module?
	movedSinceLastGcd() {
		return (
			Math.abs(this.combatant.resources.x - this.pos.x) > 1 &&
			Math.abs(this.combatant.resources.y - this.pos.y) > 1
		)
	}

	output() {
		const potLossPerR2 = this.RUIN3_POT - this.RUIN2_POT
		const issues = this.issues.length
		const warnings = this.warnings.length

		return <Fragment>
			Try to limit your use of <ActionLink {...ACTIONS.RUIN_II}/> to weaving oGCDs, and proccing <ActionLink {...ACTIONS.WYRMWAVE}/>s during <ActionLink {...ACTIONS.SUMMON_BAHAMUT}/>. You lost {issues * potLossPerR2} potency to {issues} casts that should have been <ActionLink {...ACTIONS.RUIN_III}/>, and could gain up to {warnings * potLossPerR2} additional potency by reducing the {warnings} casts used only to move.
		</Fragment>
	}
}
