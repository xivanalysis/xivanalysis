import Module from '@/parser/core/Module'

import ACTIONS from '@/data/ACTIONS'

export default class Ruin2 extends Module {
	static dependencies = [
		'combatant'
	]

	// TODO: If (when) I set up the timeline, should probably mark bad R2s on it

	all = []
	warnings = []
	issues = []

	lastGcd = null
	ogcdUsed = false
	pos = {}

	// Limiting to player, not worried about pets for this check
	on_cast_byPlayer(event) {
		// TODO: should move action lookup into an export from ACTIONS with fallback handling
		const action = ACTIONS[event.ability.guid] || {}
		const lastGcdAction = (this.lastGcd && ACTIONS[this.lastGcd.ability.guid]) || {}

		// TODO: GCD metadata should be in a module
		// TODO: I'm not checking for brohamut at the moment - no-movement, no oGCD r2
		//       during akh morning is a-ok 'cus WWs
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

		// If this is an R2 cast, track it and reset oGCD checker
		if (action.id === ACTIONS.RUIN_II.id) {
			this.all.push(event)
			this.ogcdUsed = false
		}
	}

	on_complete() {
		console.log(this)
	}

	// TODO: Should this be in some other module?
	movedSinceLastGcd() {
		return (
			Math.abs(this.combatant.resources.x - this.pos.x) > 1 &&
			Math.abs(this.combatant.resources.y - this.pos.y) > 1
		)
	}
}
