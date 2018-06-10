import React, { Fragment } from 'react'

import ACTIONS from 'data/ACTIONS'
import { ActionLink } from 'components/ui/DbLink'
import Module from 'parser/core/Module'
import { Suggestion, SEVERITY } from 'parser/core/modules/Suggestions'

// Constants
// Unlike HW, don't need to worry about mana drain too much. It's just flat pot.
// TODO: Ok where is this gcd metadata gonna be stored at the end of the day?
//       ACTIONS is looking more and more tasty
const RUIN2_POT = 100
const RUIN3_POT = 120

export default class Ruin2 extends Module {
	static dependencies = [
		'combatants',
		'gauge',
		'suggestions'
	]

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

		// TODO: combatant resources are janky. Replace.
		if (action.onGcd) {
			// If this cast is on the gcd, store it for comparison
			this.lastGcd = event
			this.pos = this.combatants.selected.resources
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
			Math.abs(this.combatants.selected.resources.x - this.pos.x) > 1 &&
			Math.abs(this.combatants.selected.resources.y - this.pos.y) > 1
		)
	}

	on_complete() {
		const potLossPerR2 = RUIN3_POT - RUIN2_POT
		const issues = this.issues.length
		const warnings = this.warnings.length

		if (issues) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.RUIN_III.icon,
				content: <Fragment>
					<ActionLink {...ACTIONS.RUIN_II}/> is a DPS loss when not used to weave oGCDs or proc <ActionLink {...ACTIONS.WYRMWAVE}/>s. Prioritise casting <ActionLink {...ACTIONS.RUIN_III}/>.
				</Fragment>,
				why: (issues * potLossPerR2) + ' potency lost to unnecessary Ruin II casts.',
				severity: issues < 5? SEVERITY.MINOR : issues < 10? SEVERITY.MEDIUM : SEVERITY.MAJOR
			}))
		}

		if (warnings) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.RUIN_II.icon,
				content: <Fragment>
					Unless significant movement is required, avoid using <ActionLink {...ACTIONS.RUIN_II}/> for movement. Most position adjustments can be performed with slidecasting and the additional mobility available during <ActionLink {...ACTIONS.DREADWYRM_TRANCE}/>.
				</Fragment>,
				why: (warnings * potLossPerR2) + ' potency lost to Ruin II casts used only to move.',
				severity: warnings < 5? SEVERITY.MINOR : warnings < 10? SEVERITY.MEDIUM : SEVERITY.MAJOR
			}))
		}
	}
}
