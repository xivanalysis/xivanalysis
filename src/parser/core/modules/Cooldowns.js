import React from 'react'

import Module, { DISPLAY_ORDER } from 'parser/core/Module'
import {getAction} from 'data/ACTIONS'

// Track the cooldowns on actions and shit
export default class Cooldowns extends Module {
	// I mean this isn't even going to have an output when I'm done, so throw it down bottom
	static displayOrder = DISPLAY_ORDER.BOTTOM

	currentAction = null
	cooldowns = {}

	// cooldown starts at the beginning of the casttime
	// (though 99% of CD based abilities have no cast time)
	// TODO: Should I be tracking pet CDs too? I mean, contagion/radiant are a thing.
	on_begincast_byPlayer(event) {
		const action = getAction(event.ability.guid)
		if (!action.cooldown) { return }

		this.currentAction = action

		this.startCooldown(action)
	}

	on_cast_byPlayer(event) {
		const action = getAction(event.ability.guid)
		if (!action.cooldown) { return }

		const finishingCast = this.currentAction && this.currentAction.id === action.id
		this.currentAction = null

		if (finishingCast) { return }

		this.startCooldown(action)
	}

	on_complete() {
		// The parse has finished - clean out any 'current' cooldowns into the history
		Object.keys(this.cooldowns).forEach(id => {
			const cd = this.cooldowns[id]
			if (cd.current) {
				cd.history.push(cd.current)
				cd.current = null
			}
		})
	}

	getCooldown(action) {
		return this.cooldowns[action.id] || {
			current: null,
			history: []
		}
	}

	startCooldown(action) {
		// TODO: handle shared CDs

		// Get the current cooldown status, falling back to a new cooldown
		const cd = this.getCooldown(action)

		// If there's a current object, move it into the history
		// TODO: handle errors on CD overlap
		if (cd.current) {
			cd.history.push(cd.current)
		}

		cd.current = {
			timestamp: this.parser.currentTimestamp,
			length: action.cooldown * 1000 // CDs are in S, timestamps are in MS
		}

		// Save the info back out (to ensure propagation if we've got a new info)
		this.cooldowns[action.id] = cd
	}

	reduceCooldown(action, reduction) {
		const cd = this.getCooldown(action)

		// Check if current isn't current
		if (cd.current && cd.current.timestamp + cd.current.length < this.parser.currentTimestamp) {
			cd.history.push(cd.current)
			cd.current = null
		}

		// TODO: Do I need to warn if they're reducing cooldown on something _with_ no cooldown?
		if (cd.current === null) {
			return
		}

		cd.current.length -= reduction * 1000

		// TODO: should i check again if it needs to be history pushed, or can the next person deal with that?
	}

	// TODO: Should this be here?
	getTimeOnCooldown(action) {
		const cd = this.getCooldown(action)

		// TODO: This doesn't account for anything in `current`.
		return cd.history.reduce((time, status) => time + status.length, 0)
	}

	// Pretty temp
	output() {
		return <ul>
			{Object.keys(this.cooldowns).map(actionId => {
				const action = getAction(actionId)
				return <li key={actionId}>
					{action.name}
					<ul>
						{this.cooldowns[actionId].history.map(use =>
							<li key={use.timestamp}>
								TS: {this.parser.formatTimestamp(use.timestamp)}<br/>
								CD: {this.parser.formatDuration(use.length)}
							</li>
						)}
					</ul>
				</li>
			})}
		</ul>
	}
}
