import React from 'react'

import { getAction } from 'data/ACTIONS'
import Module, { DISPLAY_ORDER } from 'parser/core/Module'
import { Group, Item } from './Timeline'

// Track the cooldowns on actions and shit
export default class Cooldowns extends Module {
	static dependencies = [
		'timeline'
	]
	// I mean this isn't even going to have an output when I'm done, so throw it down bottom
	static displayOrder = DISPLAY_ORDER.BOTTOM
	name = 'Cooldowns'

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
		const startTime = this.parser.fight.start_time

		Object.keys(this.cooldowns).forEach(id => {
			const cd = this.cooldowns[id]

			// Clean out any 'current' cooldowns into the history
			if (cd.current) {
				cd.history.push(cd.current)
				cd.current = null
			}

			// Add CD info to the timeline
			// TODO: Might want to move group generation somewhere else
			//       though will need to handle hidden groups for things with no items
			const action = getAction(id)
			this.timeline.addGroup(new Group({
				id,
				content: action.name
			}))

			cd.history.forEach(use => {
				this.timeline.addItem(new Item({
					type: 'background',
					start: use.timestamp - startTime,
					end: use.timestamp + use.length - startTime,
					group: id,
					content: `<img src="${action.icon}" alt="${action.name}">`
				}))
			})
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

	resetCooldown(action) {
		const cd = this.getCooldown(action)

		// If there's nothing running, we can just stop
		// TODO: need to warn?
		if (cd.current === null) {
			return
		}

		// Fix up the length
		cd.current.length = this.parser.currentTimestamp - cd.current.timestamp

		// Move the CD into the history
		cd.history.push(cd.current)
		cd.current = null
	}

	// TODO: Should this be here?
	getTimeOnCooldown(action) {
		const cd = this.getCooldown(action)
		const currentTimestamp = this.parser.currentTimestamp

		// Doesn't count time on CD outside the bounds of the current fight, it'll throw calcs off
		return cd.history.reduce(
			(time, status) => time + Math.min(status.length, currentTimestamp - status.timestamp),
			cd.current? Math.min(cd.current.length, currentTimestamp - cd.current.timestamp) : 0
		)
	}

	get used() {
		return Object.keys(this.cooldowns)
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
