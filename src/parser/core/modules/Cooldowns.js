import React from 'react'
import _ from 'lodash'

import ACTIONS, {COOLDOWN_GROUPS} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {ItemGroup, Item} from './Timeline'
import {getDataBy} from 'data'

// Default value for allowableDrift on the getCooldownUsageDetails method
// CooldownDowntime will override this, but to prevent existence check problems or allow other consumers to call method, define a default
const DEFAULT_ALLOWABLE_DRIFT_TIMES = {
	firstUse: 0,
	afterFullyRecharged: 0,
}

// Track the cooldowns on actions and shit
export default class Cooldowns extends Module {
	static handle = 'cooldowns'
	static dependencies = [
		'timeline',
		'downtime',
	]

	// Array used to sort cooldowns in the timeline. Elements should be either IDs for
	// top-level groups, or objects of the format {name: string, actions: array} for
	// nested groups. Actions not specified here will be sorted by their ID below.
	// Check the NIN and SMN modules for examples.
	static cooldownOrder = []

	_currentAction = null
	_cooldowns = {}
	_groups = {}

	constructor(...args) {
		super(...args)

		// Pre-build groups for actions explicitly set by subclasses
		this._buildGroups(this.constructor.cooldownOrder)

		this.addHook('begincast', {by: 'player'}, this._onBeginCast)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	_buildGroups(groups) {
		// If there's no groups, noop
		if (!groups) { return }

		const ids = groups.map((data, i) => {
			const order = -(groups.length - i)

			// If it's just an action id, build a group for it and stop
			if (typeof data === 'number') {
				const action = getDataBy(ACTIONS, 'id', data)
				this._buildGroup({
					id: data,
					content: action && action.name,
					order,
				})
				return data
			}

			// Build the base group
			const group = this._buildGroup({
				id: data.name,
				content: data.name,
				order,
			})

			if (data.merge) {
				// If it's a merge group, we only need to register our group for each of the IDs
				data.actions.forEach(id => {
					this._groups[id] = group
				})
			} else {
				// Otherwise, build nested groups for each action
				group.nestedGroups = this._buildGroups(data.actions)
			}

			return data.name
		})

		return ids
	}

	_buildGroup(opts) {
		const group = new ItemGroup(opts)
		this.timeline.addGroup(group)
		this._groups[opts.id] = group
		return group
	}

	// cooldown starts at the beginning of the casttime
	// (though 99% of CD based abilities have no cast time)
	// TODO: Should I be tracking pet CDs too? I mean, contagion/radiant are a thing.
	_onBeginCast(event) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)
		if (!action || action.cooldown == null) { return }

		this._currentAction = action

		this.startCooldown(action.id)
		if (!_.isNil(action.cooldownGroup)) {
			this.startCooldownGroup(action.id, action.cooldownGroup)
		}
	}

	_onCast(event) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)
		if (!action || action.cooldown == null) { return }

		const finishingCast = this._currentAction && this._currentAction.id === action.id
		this._currentAction = null

		if (finishingCast) { return }

		this.startCooldown(action.id)
		if (!_.isNil(action.cooldownGroup)) {
			this.startCooldownGroup(action.id, action.cooldownGroup)
		}
	}

	_onComplete() {
		Object.keys(this._cooldowns).forEach(actionId => {
			this._addToTimeline(parseInt(actionId, 10))
		})
	}

	_addToTimeline(actionId) {
		const cd = this._cooldowns[actionId]
		if (!cd) {
			return false
		}

		// Clean out any 'current' cooldowns into the history
		if (cd.current) {
			cd.history.push(cd.current)
			cd.current = null
		}

		const action = getDataBy(ACTIONS, 'id', actionId)

		// If the action is on the GCD, GlobalCooldown will be managing its own group
		if (!action || action.onGcd) {
			return false
		}

		// Ensure we've got a group for this item
		if (!this._groups[actionId]) {
			this._buildGroup({
				id: actionId,
				content: action.name,
				order: actionId,
			})
		}

		// Add CD info to the timeline
		cd.history.forEach(use => {
			if (!use.shared) {
				this._groups[actionId].addItem(new Item({
					type: 'background',
					start: use.timestamp - this.parser.fight.start_time,
					length: use.length,
					content: <img src={action.icon} alt={action.name} />,
				}))
			}
		})

		return true
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
		const action = getDataBy(ACTIONS, 'id', actionId)
		if (!action) { return }

		// Get the current cooldown status, falling back to a new cooldown
		const cd = this.getCooldown(actionId)

		// If there's a current object, move it into the history
		// TODO: handle errors on CD overlap
		if (cd.current) {
			if (cd.current.timestamp < this.parser.fight.start_time) {
				// Pre-pull usage, reset the cooldown to prevent overlap on timeline since we don't know exactly when cooldown was used pre-pull
				this.resetCooldown(actionId)
			} else {
				cd.history.push(cd.current)
			}
		}

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

		for (const cooldown of cd.history) {
			//Invuln time is any time the boss was invuln between the time the previous cooldown ended and the current execution occurred
			cooldown.invulnTime = this.downtime.getDowntime(previousEndTimestamp, cooldown.timestamp)

			previousEndTimestamp = (cooldown.timestamp + cooldown.length)
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

	getCooldownUsageDetails(actionId, considerInvulnTime = false, allowableDrift = DEFAULT_ALLOWABLE_DRIFT_TIMES) {
		const actionInfo = getDataBy(ACTIONS, 'id', actionId)
		const cd = this.getCooldown(actionId)
		let _lastUsageWhenFullyCharged = null
		let _cooldownSinceLastFullyCharged = 0
		let _timeGainedFromCooldownReductions = 0

		if (considerInvulnTime) {
			this.setInvulnTime(actionId)
		}

		cd.history.forEach((usage, index) => {
			// Track how much time was gained from cooldown reductions or resets, if usage.cooldown is lower than defined base action cooldown
			// Clamp to 0 for safety - should never have usage.cooldown longer than actionInfo.cooldown
			_timeGainedFromCooldownReductions += Math.max(actionInfo.cooldown - usage.length, 0)

			if (index === 0) {
				// First use of cooldown - calculate drift based on fight start and allowable firstUse drift
				// Clamp to 0 for pre-pull casts (will have a synthesized timestamp of -2ms)
				const drift = Math.max(usage.timestamp - this.parser.fight.start_time, 0)
				usage.driftInfo = Cooldowns.getDriftInfo(drift, 'firstUse', usage.invulnTime, allowableDrift.firstUse)

				_lastUsageWhenFullyCharged = usage
				_cooldownSinceLastFullyCharged = usage.length
			} else {
				// Subsequent use of cooldown - calculate drift based on distance between two usages
				const timeSinceFullyCharged = usage.timestamp - _lastUsageWhenFullyCharged.timestamp
				if (timeSinceFullyCharged >= _cooldownSinceLastFullyCharged) {
					const drift = timeSinceFullyCharged - _cooldownSinceLastFullyCharged
					usage.driftInfo = Cooldowns.getDriftInfo(drift, 'afterFullyRecharged', usage.invulnTime, allowableDrift.afterFullyRecharged)

					_lastUsageWhenFullyCharged = usage
					_cooldownSinceLastFullyCharged = usage.length
				} else {
					// No drift occurred on this cast - used another charge
					// TODO: check to see if skill is actually defined as having charges and trigger BrokenLog?
					usage.driftInfo = Cooldowns.getDriftInfo(0, 'afterFullyRecharged', 0, 0)
					_cooldownSinceLastFullyCharged += usage.length
				}
			}
		})

		const fightDuration = this.parser.fight.end_time - this.parser.fight.start_time
		const validDrift = cd.history.reduce((valid, usage) => valid + usage.driftInfo.allowable + usage.driftInfo.invulnerable, 0)
		return {
			actualUses: cd.history.length,
			expectedUses: Cooldowns.getExpectedUses(fightDuration, actionInfo.cooldown * 1000, _timeGainedFromCooldownReductions, validDrift),
			history: cd.history,
			resetTimeGained: _timeGainedFromCooldownReductions,
			totalValidDrift: validDrift,
		}
	}

	static getDriftInfo(drift, driftReason, invulnTime, allowableDrift) {
		// Adjust drift for time the boss was invulnerable at the end of the cooldown.
		drift = Math.max(drift - invulnTime, 0)

		// Apportion remaining drift between allowable (as defined by allowableDrift) and bad
		const _allowable = Math.min(drift, allowableDrift)

		return {
			driftReason: driftReason,
			allowable: _allowable,
			invulnerable: invulnTime,
			bad: drift - _allowable,
		}
	}

	static getExpectedUses(fightDuration, actionCooldownMS, timeGainedFromCooldownReductions, validDrift) {
		return Math.ceil((fightDuration + timeGainedFromCooldownReductions - validDrift) / actionCooldownMS)
	}
}
