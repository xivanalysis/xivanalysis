import {Action, ActionKey} from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import _ from 'lodash'
import Module from 'parser/core/Module'
import {dependency} from '../Injectable'
import {Data} from './Data'
import Downtime from './Downtime'
import {ActionItem, ContainerRow, Timeline} from './Timeline'

export interface CooldownOrderGroup {
	name: string
	actions: ActionKey[]
}

export type CooldownOrderItem =
	| CooldownOrderGroup
	| ActionKey

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
	static handle = 'cooldowns'

	@dependency private data!: Data
	@dependency private downtime!: Downtime
	@dependency private timeline!: Timeline

	// Array used to sort cooldowns in the timeline. Elements should be either IDs for
	// top-level groups, or objects of the format {name: string, actions: array} for
	// nested groups. Actions not specified here will be sorted by their ID below.
	// Check the NIN and SMN modules for examples.
	static cooldownOrder: CooldownOrderItem[] = []

	private readonly _cooldownGroups: Record<string, Action[]> = _.groupBy(this.data.actions, 'cooldownGroup')

	private _currentAction?: Action
	private _cooldowns: Partial<Record<number, CooldownHistory>> = {}
	private _rows: Partial<Record<number | string, ContainerRow>> = {}

	protected init() {
		const constructor = this.constructor as typeof Cooldowns
		// Pre-build rows for actions explicitly set by subclasses
		if (constructor.cooldownOrder) {
			this._buildRows(constructor.cooldownOrder)
		}

		this.addEventHook('begincast', {by: 'player'}, this._onBeginCast)
		this.addEventHook('cast', {by: 'player'}, this._onCast)
		this.addEventHook('complete', this._onComplete)
	}

	private _buildRows(mappings: CooldownOrderItem[]) {
		mappings.forEach((mapping, index) => {
			const order = -(mappings.length - index)

			// If it's just the ID of an action, build a row for it and bail
			if (typeof mapping === 'string') {
				const action = this.data.actions[mapping]
				return this._buildRow(action.id, {label: action.name, order})
			}

			// Otherwise, it's a grouping - build a base row
			const row = this._buildRow(undefined, {label: mapping.name, order})

			// Register the group for each of the action IDs
			mapping.actions.forEach(id => {
				this._rows[id] = row
			})
		})
	}

	private _buildRow(id: number | undefined, opts: {label: string, order: number}) {
		if (id != null) {
			const currentRow = this._rows[id]
			if (currentRow != null) {
				return currentRow
			}
		}

		const row = this.timeline.addRow(new ContainerRow({
			...opts,
			collapse: true,
		}))

		if (id != null) {
			this._rows[id] = row
		}

		return row
	}

	getActionTimelineRow(action: Action) {
		return this._buildRow(action.id, {label: action.name, order: action.id})
	}

	// cooldown starts at the beginning of the casttime
	// (though 99% of CD based abilities have no cast time)
	// TODO: Should I be tracking pet CDs too? I mean, contagion/radiant are a thing.
	private _onBeginCast(event: CastEvent) {
		const action = this.data.getAction(event.ability.guid)
		if (!action || action.cooldown == null) { return }

		this._currentAction = action

		this.startCooldown(action.id)
		if (!_.isNil(action.cooldownGroup)) {
			this.startCooldownGroup(action.id, action.cooldownGroup)
		}
	}

	private _onCast(event: CastEvent) {
		const action = this.data.getAction(event.ability.guid)
		if (!action || action.cooldown == null) { return }

		const finishingCast = this._currentAction && this._currentAction.id === action.id
		this._currentAction = undefined

		if (finishingCast) { return }

		this.startCooldown(action.id)
		if (!_.isNil(action.cooldownGroup)) {
			this.startCooldownGroup(action.id, action.cooldownGroup)
		}
	}

	private _onComplete() {
		Object.keys(this._cooldowns).forEach(actionId => {
			this._addToTimeline(parseInt(actionId, 10))
		})
	}

	private _addToTimeline(actionId: number) {
		const cd = this._cooldowns[actionId]
		if (!cd) {
			return false
		}

		// Clean out any 'current' cooldowns into the history
		if (cd.current) {
			cd.history.push(cd.current)
			cd.current = undefined
		}

		const action = this.data.getAction(actionId)

		// If the action is on the GCD, GlobalCooldown will be managing its own group
		if (!action || action.onGcd) {
			return false
		}

		// Ensure we've got a row for this item
		const row = this._buildRow(actionId, {label: action.name, order: actionId})

		// Add CD info to the timeline
		cd.history
			.forEach(use => {
				if (use.shared) { return }

				const start = use.timestamp - this.parser.eventTimeOffset
				row.addItem(new ActionItem({
					start,
					end: start + use.length,
					action,
				}))
			})

		return true
	}

	getCooldown(actionId: number): CooldownHistory {
		return this._cooldowns[actionId] ?? {
			current: undefined,
			history: [],
		}
	}

	private startCooldownGroup(originActionId: number, cooldownGroup: number) {
		const sharedCooldownActions = _.get(this._cooldownGroups, cooldownGroup, [] as Action[])
		sharedCooldownActions
			.map(action => action.id)
			.filter(id => id !== originActionId)
			.forEach(id => this.startCooldown(id, true))
	}

	private startCooldown(actionId: number, sharedCooldown = false) {
		// TODO: handle shared CDs
		const action = this.data.getAction(actionId)
		if (!action) { return }

		// Get the current cooldown status, falling back to a new cooldown
		const cd = this.getCooldown(actionId)

		// If there's a current object, move it into the history
		// TODO: handle errors on CD overlap
		if (cd.current) {
			const currentFightDuration = this.parser.currentTimestamp - this.parser.eventTimeOffset
			if (cd.current.timestamp < this.parser.eventTimeOffset && cd.current.length > currentFightDuration) {
				// Pre-pull usage, reset the cooldown to prevent overlap on timeline since we don't know exactly when cooldown was used pre-pull
				this.resetCooldown(actionId)
			} else {
				cd.history.push(cd.current)
			}
		}

		cd.current = {
			timestamp: this.parser.currentTimestamp,
			length: (action.cooldown ?? 0) * 1000, // CDs are in S, timestamps are in MS
			shared: sharedCooldown,
			invulnTime: 0,
		}

		// Save the info back out (to ensure propagation if we've got a new info)
		this._cooldowns[actionId] = cd
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
		cd.current.length -= reduction * 1000

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
			previousCooldown.invulnTime = this.downtime.getDowntime(previousEndTimestamp, cooldown.timestamp)
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
