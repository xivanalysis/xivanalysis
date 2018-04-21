import Module from '@/parser/core/Module'

import ACTIONS from '@/data/ACTIONS'

export default class Ruin2 extends Module {
	// TODO: If (when) I set up the timeline, should probably mark bad R2s on it

	all = []
	warnings = []
	issues = []

	lastGcd = null
	ogcdUsed = false

	on_cast(event) {
		// TODO: Limiting to just me. Needs to be generalised into the function handler
		if (event.sourceID !== 1) { return }

		// TODO: should move action lookup into an export from ACTIONS with fallback handling
		const action = ACTIONS[event.ability.guid] || {}
		const lastGcdAction = (this.lastGcd && ACTIONS[this.lastGcd.ability.guid]) || {}

		// TODO: GCD metadata should be in a module
		// If there was no oGCD cast between the R2 and now, mark an issue
		if (
			action.onGcd &&
			lastGcdAction.id === ACTIONS.RUIN_II.id &&
			!this.ogcdUsed
		) {
			// TODO: Distinguish between movement and no movement
			//       pos will be in combatant module i guess
			this.warnings.push(event)
		}

		if (action.onGcd) {
			// If this cast is on the gcd, store it for comparison
			this.lastGcd = event
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

	// // TODO: Should this be in some other module?
	// movedSinceLastGcd(event) {
	// 	return (
	// 		Math.abs(event.sourceResources.x - this.lastGcdEvent.sourceResources.x) > 1 &&
	// 		Math.abs(event.sourceResources.y - this.lastGcdEvent.sourceResources.y) > 1
	// 	)
	// }
}
