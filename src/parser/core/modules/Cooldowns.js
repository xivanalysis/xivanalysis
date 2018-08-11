import React from 'react'
import _ from 'lodash'

import {COOLDOWN_GROUPS, getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Group, Item} from './Timeline'

// Track the cooldowns on actions and shit
export default class Cooldowns extends Module {
	static handle = 'cooldowns'
	static dependencies = [
		'timeline',
		'downtime',
	]

	_currentAction = null
	_cooldowns = {}

	constructor(...args) {
		super(...args)
		this.addHook('begincast', {by: 'player'}, this._onBeginCast)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	// cooldown starts at the beginning of the casttime
	// (though 99% of CD based abilities have no cast time)
	// TODO: Should I be tracking pet CDs too? I mean, contagion/radiant are a thing.
	_onBeginCast(event) {
		const action = getAction(event.ability.guid)
		if (!action.cooldown) { return }

		this._currentAction = action

		this.startCooldown(action.id)
		if (!_.isNil(action.cooldownGroup)) {
			this.startCooldownGroup(action.id, action.cooldownGroup)
		}
	}

	_onCast(event) {
		const action = getAction(event.ability.guid)
		if (!action.cooldown) { return }

		const finishingCast = this._currentAction && this._currentAction.id === action.id
		this._currentAction = null

		if (finishingCast) { return }

		this.startCooldown(action.id)
		if (!_.isNil(action.cooldownGroup)) {
			this.startCooldownGroup(action.id, action.cooldownGroup)
		}
	}

	_onComplete() {
		const startTime = this.parser.fight.start_time

		Object.keys(this._cooldowns).forEach(id => {
			const cd = this._cooldowns[id]

			// Clean out any 'current' cooldowns into the history
			if (cd.current) {
				cd.history.push(cd.current)
				cd.current = null
			}

			const action = getAction(id)

			// If the action is on the GCD, GlobalCooldown will be managing its own group
			if (action.onGcd) {
				return
			}

			// Add CD info to the timeline
			// TODO: Might want to move group generation somewhere else
			//       though will need to handle hidden groups for things with no items
			// Using the ID as an order param to give an explicit order.
			// TODO: Allow jobs to group related actions a-la raid buffs
			this.timeline.addGroup(new Group({
				id,
				content: action.name,
				order: id,
			}))

			cd.history.forEach(use => {
				if (!use.shared) {
					this.timeline.addItem(new Item({
						type: 'background',
						start: use.timestamp - startTime,
						length: use.length,
						group: id,
						content: <img src={action.icon} alt={action.name}/>,
					}))
				}
			})
		})
	}

	getCooldown(actionId) {
		return this._cooldowns[actionId] || {
			current: null,
			history: [],
		}
	}

	startCooldownGroup(originActionId, cooldownGroup) {
		const sharedCooldownActions = _.get(COOLDOWN_GROUPS, cooldownGroup, [])
		sharedCooldownActions
			.map(action => action.id)
			.filter(id => id !== originActionId)
			.forEach(id => this.startCooldown(id, true))
	}

	startCooldown(actionId, sharedCooldown = false) {
		// TODO: handle shared CDs

		// Get the current cooldown status, falling back to a new cooldown
		const cd = this.getCooldown(actionId)

		// If there's a current object, move it into the history
		// TODO: handle errors on CD overlap
		if (cd.current) {
			cd.history.push(cd.current)
		}

		const action = getAction(actionId)
		cd.current = {
			timestamp: this.parser.currentTimestamp,
			length: action.cooldown * 1000, // CDs are in S, timestamps are in MS
			shared: sharedCooldown,
			invulnTime: 0,
		}

		// Save the info back out (to ensure propagation if we've got a new info)
		this._cooldowns[actionId] = cd
	}

	reduceCooldown(actionId, reduction) {
		const cd = this.getCooldown(actionId)
		const currentTimestamp = this.parser.currentTimestamp

		// Check if current isn't current
		if (cd.current && cd.current.timestamp + cd.current.length < currentTimestamp) {
			cd.history.push(cd.current)
			cd.current = null
		}

		// TODO: Do I need to warn if they're reducing cooldown on something _with_ no cooldown?
		if (cd.current === null) {
			return
		}

		// Reduce the CD
		cd.current.length -= reduction * 1000

		// If the reduction would have made it come off CD earlier than now, reset it - the extra time reduction should be lost.
		if (cd.current.timestamp + cd.current.length < currentTimestamp) {
			this.resetCooldown(actionId)
		}
	}

	setInvulnTime(actionId) {
		const cd = this.getCooldown(actionId)
		let previousEndTimestamp = this.parser.fight.start_time
		let previousCooldown = {}
		let isFirst = true

		for (const cooldown of cd.history) {
			if (isFirst) {
				previousEndTimestamp = (cooldown.timestamp + cooldown.length)
				isFirst = false
				previousCooldown = cooldown
			}

			//We invuln time is the time the boss was invuln from when the CD came off CD and when it was next executed
			previousCooldown.invulnTime = this.downtime.getDowntime(previousEndTimestamp, cooldown.timestamp)
			previousEndTimestamp = (cooldown.timestamp + cooldown.length)
			previousCooldown = cooldown
		}
	}

	resetCooldown(actionId) {
		const cd = this.getCooldown(actionId)

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

	getCooldownRemaining(actionId) {
		const current = this.getCooldown(actionId).current
		if (!current) {
			return 0
		}

		return current.length - (this.parser.currentTimestamp - current.timestamp)
	}

	// TODO: Should this be here?
	getTimeOnCooldown(actionId, considerInvulnTime = false, extension = 0) {
		const cd = this.getCooldown(actionId)
		const currentTimestamp = this.parser.currentTimestamp

		if (considerInvulnTime) {
			this.setInvulnTime(actionId)
		} else {
			cd.history.map(cooldown => {
				cooldown.invulnTime = 0
			})
		}

		return cd.history.reduce(
			(time, status) => time + this.getAdjustedTimeOnCooldown(status, currentTimestamp, extension),
			cd.current? this.getAdjustedTimeOnCooldown(cd.current, currentTimestamp, extension) : 0
		)
	}

	getAdjustedTimeOnCooldown(cooldown, currentTimestamp, extension) {
		// Doesn't count time on CD outside the bounds of the current fight, it'll throw calcs off
		// Add to the length of the cooldown any invuln time for the boss
		// Additionally account for any extension the caller allowed to the CD Length
		const duration = currentTimestamp - cooldown.timestamp
		const maximumDuration = cooldown.length + cooldown.invulnTime + extension
		return _.clamp(duration, 0, maximumDuration)
	}

	get used() {
		return Object.keys(this._cooldowns)
	}
}
