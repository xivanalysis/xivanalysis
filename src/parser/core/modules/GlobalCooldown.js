import math from 'mathjsCustom'

import {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import { Group, Item } from './Timeline'

const MIN_GCD = 1500
const MAX_GCD = 2500

export default class GlobalCooldown extends Module {
	static dependencies = [
		'timeline'
	]
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

	on_complete() {
		const gcdLength = this.getEstimate()
		const startTime = this.parser.fight.start_time

		// TODO: Look into adding items to groups? Maybe?
		this.timeline.addGroup(new Group({
			id: 'gcd',
			content: 'GCD'
		}))

		this.gcds.forEach(gcd => {
			this.timeline.addItem(new Item({
				type: 'background',
				start: gcd.timestamp - startTime,
				length: gcdLength,
				group: 'gcd'
			}))
		})
	}

	saveGcd(event) {
		if (this.lastGcd >= 0) {
			const diff = event.timestamp - this.lastGcd

			// GCD is only to two decimal places, so round it there. Storing in Ms.
			const gcd = Math.round(diff/10)*10
			this.gcds.push({
				timestamp: event.timestamp,
				length: gcd
			})
		}

		// Store current gcd time for the check
		this.lastGcd = event.timestamp
	}

	getEstimate() {
		// TODO: THIS WILL BREAK ON BLM 'CUS F4's CAST IS LONGER THAN THE GCD

		// TODO: /analyse/jgYqcMxtpDTCX264/8/50/
		//       Estimate is 2.31, actual is 2.35. High Arrow uptime.

		// Mode seems to get best results. Using mean in case there's multiple modes.
		const lengths = this.gcds.map(gcd => gcd.length)
		const estimate = math.mean(math.mode(lengths))

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
