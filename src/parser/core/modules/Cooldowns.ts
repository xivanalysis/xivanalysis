import {getDataArrayBy} from 'data'
import {Action} from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import _ from 'lodash'
import Module from 'parser/core/Module'
import {dependency} from '../Injectable'
import {Data} from './Data'
import Downtime from './Downtime'

interface CooldownState {
	timestamp: number,
	length: number,
	shared: boolean,
	invulnTime: number,
}

interface CooldownHistory {
	current?: CooldownState
	history: CooldownState[]
}

// Track the cooldowns on actions and shit
export default class Cooldowns extends Module {
	static override handle = 'cooldowns'

	@dependency private data!: Data
	@dependency private downtime!: Downtime

	private _currentAction?: Action
	private _cooldowns = new Map<number, CooldownHistory>()

	protected override init() {
		this.addEventHook('begincast', {by: 'player'}, this._onBeginCast)
		this.addEventHook('cast', {by: 'player'}, this._onCast)
		this.addEventHook('complete', this._onComplete)
	}

	// cooldown starts at the beginning of the casttime
	// (though 99% of CD based abilities have no cast time)
	// TODO: Should I be tracking pet CDs too? I mean, contagion/radiant are a thing.
	private _onBeginCast(event: CastEvent) {
		const action = this.data.getAction(event.ability.guid)
		if (!action || action.cooldown == null) { return }

		this._currentAction = action

		this.startCooldownGroup(action)
	}

	private _onCast(event: CastEvent) {
		const action = this.data.getAction(event.ability.guid)
		if (!action || action.cooldown == null) { return }

		const finishingCast = this._currentAction && this._currentAction.id === action.id
		this._currentAction = undefined

		if (finishingCast) { return }

		this.startCooldownGroup(action)
	}

	private _onComplete() {
		this._cooldowns.forEach((history) => {
			this._cleanHistory(history)
		})
	}

	private _cleanHistory(history: CooldownHistory) {
		if (history.current == null) { return }
		// Clean out any 'current' cooldowns into the history
		history.history.push(history.current)
		history.current = undefined
	}

	getCooldown(actionId: number): CooldownHistory {
		let history = this._cooldowns.get(actionId)
		if (history == null) {
			history = {
				current: undefined,
				history: [],
			}
			this._cooldowns.set(actionId, history)
		}
		return history
	}

	private startCooldownGroup(action: Action) {
		const cooldownGroup = getDataArrayBy(this.data.actions, 'cooldownGroup', action.cooldownGroup)
		const cooldownActions = cooldownGroup.length > 0 ? cooldownGroup : [action]

		cooldownActions.forEach(cooldownAction => this.startCooldown(
			cooldownAction,
			cooldownAction.id !== action.id
		))
	}

	private startCooldown(action: Action, sharedCooldown = false) {
		// Get the current cooldown status, falling back to a new cooldown
		const cd = this.getCooldown(action.id)

		// If there's a current object, move it into the history
		// TODO: handle errors on CD overlap
		if (cd.current) {
			const currentFightDuration = this.parser.currentTimestamp - this.parser.eventTimeOffset
			if (cd.current.timestamp < this.parser.eventTimeOffset && cd.current.length > currentFightDuration) {
				// Pre-pull usage, reset the cooldown to prevent overlap on timeline since we don't know exactly when cooldown was used pre-pull
				this.resetCooldown(action.id)
			} else {
				cd.history.push(cd.current)
			}
		}

		cd.current = {
			timestamp: this.parser.currentTimestamp,
			length: action.cooldown ?? 0,
			shared: sharedCooldown,
			invulnTime: 0,
		}
	}

	reduceCooldown(actionId: number, reduction: number) {
		const cd = this.getCooldown(actionId)
		const currentTimestamp = this.parser.currentTimestamp

		// Check if current isn't current
		if (cd.current && cd.current.timestamp + cd.current.length < currentTimestamp) {
			cd.history.push(cd.current)
			cd.current = undefined
		}

		// TODO: Do I need to warn if they're reducing cooldown on something _with_ no cooldown?
		if (cd.current == null) {
			return
		}

		// Reduce the CD
		cd.current.length -= reduction

		// If the reduction would have made it come off CD earlier than now, reset it - the extra time reduction should be lost.
		if (cd.current.timestamp + cd.current.length < currentTimestamp) {
			this.resetCooldown(actionId)
		}
	}

	private setInvulnTime(actionId: number) {
		const cd = this.getCooldown(actionId)
		let previousEndTimestamp = this.parser.eventTimeOffset
		let previousCooldown: CooldownState | undefined

		for (const cooldown of cd.history) {
			if (previousCooldown == null) {
				previousEndTimestamp = (cooldown.timestamp + cooldown.length)
				previousCooldown = cooldown
			}

			//We invuln time is the time the boss was invuln from when the CD came off CD and when it was next executed
			previousCooldown.invulnTime = this.downtime.getDowntime(
				this.parser.fflogsToEpoch(previousEndTimestamp),
				this.parser.fflogsToEpoch(cooldown.timestamp),
			)
			previousEndTimestamp = (cooldown.timestamp + cooldown.length)
			previousCooldown = cooldown
		}
	}

	resetCooldown(actionId: number) {
		const cd = this.getCooldown(actionId)

		// If there's nothing running, we can just stop
		// TODO: need to warn?
		if (cd.current == null) {
			return
		}

		// Fix up the length
		cd.current.length = this.parser.currentTimestamp - cd.current.timestamp

		// Move the CD into the history
		cd.history.push(cd.current)
		cd.current = undefined
	}

	getCooldownRemaining(actionId: number) {
		const current = this.getCooldown(actionId).current
		if (!current) {
			return 0
		}

		return current.length - (this.parser.currentTimestamp - current.timestamp)
	}

	// TODO: Should this be here?
	getTimeOnCooldown(actionId: number, considerInvulnTime = false, extension = 0) {
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
			cd.current ? this.getAdjustedTimeOnCooldown(cd.current, currentTimestamp, extension) : 0,
		)
	}

	private getAdjustedTimeOnCooldown(cooldown: CooldownState, currentTimestamp: number, extension: number) {
		// Doesn't count time on CD outside the bounds of the current fight, it'll throw calcs off
		// Add to the length of the cooldown any invuln time for the boss
		// Additionally account for any extension the caller allowed to the CD Length
		const duration = currentTimestamp - cooldown.timestamp
		const maximumDuration = cooldown.length + cooldown.invulnTime + extension
		return _.clamp(duration, 0, maximumDuration)
	}
}
