import math from 'mathjs'

import Module from '@/parser/core/Module'

import ACTIONS from '@/data/ACTIONS'

export default class GlobalCooldown extends Module {

	lastGcd = -1
	currentAction = null

	gcds = []

	// wowa uses beginchannel for this...? need info for flamethrower/that ast skill/passage of arms
	on_begincast_byPlayer(event) {
		const action = ACTIONS[event.ability.guid] || {}
		if (!action.onGcd) { return }

		// Can I check for cancels?

		this.currentAction = action

		this.tempCheckGcd(event)
	}


	on_cast_byPlayer(event) {
		const action = ACTIONS[event.ability.guid] || {}

		// Ignore non-GCD casts
		if (!action.onGcd) { return }

		const finishingCast = this.currentAction && this.currentAction.id === action.id
		this.currentAction = null

		if (finishingCast) { return }

		this.tempCheckGcd(event)
	}

	on_complete() {
		console.log('median', math.median(this.gcds))
		console.log('mean', math.mean(this.gcds))
		console.log('mode', math.mean(math.mode(this.gcds)))
	}

	tempCheckGcd(event) {
		// TEMP: just logging the time for now
		if (this.lastGcd >= 0) {
			const diff = event.timestamp - this.lastGcd

			// GCD is only to two decimal places, so round it there then divide to get seconds
			const gcd = Math.round(diff/10)/100
			this.gcds.push(gcd)
		}

		// Store current gcd time for the check
		this.lastGcd = event.timestamp
	}
}
