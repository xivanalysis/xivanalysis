import math from 'mathjsCustom'

import {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'

const MIN_GCD = 1500
const MAX_GCD = 2500

export default class GlobalCooldown extends Module {
	name = 'Global Cooldown'

	lastGcd = -1
	currentAction = null

	gcds = []

	// wowa uses beginchannel for this...? need info for flamethrower/that ast skill/passage of arms
	on_begincast_byPlayer(event) {
		const action = getAction(event.ability.guid)
		if (!action.onGcd) { return }

		// Can I check for cancels?

		this.currentAction = action

		this.saveGcd(event)
	}


	on_cast_byPlayer(event) {
		const action = getAction(event.ability.guid)

		// Ignore non-GCD casts
		if (!action.onGcd) { return }

		const finishingCast = this.currentAction && this.currentAction.id === action.id
		this.currentAction = null

		if (finishingCast) { return }

		this.saveGcd(event)
	}

	saveGcd(event) {
		if (this.lastGcd >= 0) {
			const diff = event.timestamp - this.lastGcd

			// GCD is only to two decimal places, so round it there. Storing in Ms.
			const gcd = Math.round(diff/10)
			this.gcds.push(gcd*10)
		}

		// Store current gcd time for the check
		this.lastGcd = event.timestamp
	}

	getEstimate() {
		// TODO: THIS WILL BREAK ON BLM 'CUS F4's CAST IS LONGER THAN THE GCD

		// Mode seems to get best results. Using mean in case there's module modes.
		const estimate = math.mean(math.mode(this.gcds))

		// Bound the result
		return Math.max(MIN_GCD, Math.min(MAX_GCD, estimate))
	}

	// Trashy output
	output() {
		if (this.gcds.length === 0) {
			return 'Insufficient data.'
		}

		// Some lovely shoddy output
		return 'Estimated GCD: ' + this.getEstimate()
	}
}
