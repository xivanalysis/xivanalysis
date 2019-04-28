import {Events} from '@xivanalysis/parser-core'
import {EventTypes} from 'analyser/Analyser'
import {Module} from 'analyser/Module'
import {getDataBy} from 'data'
import ACTIONS, {Action, COOLDOWN_GROUPS} from 'data/ACTIONS'

export interface Cooldown {
	/** Timestamp that the cooldown began */
	timestamp: number
	/** Length the duration of the cooldown, in ms */
	length: number
	// shared?
	// invulnTime?
}

export interface CooldownState {
	current?: Cooldown
	history: Cooldown[]
}

export class Cooldowns extends Module {
	static handle = 'cooldowns'
	// @dependency private timeline!: Timeline
	// @dependency private downtime!: Downtime

	/** Current action being cast */
	private currentAction?: Action

	/** State of all tracked cooldowns */
	private cooldowns = new Map<Action['id'], CooldownState>()

	protected init() {
		const byPlayer = {sourceId: this.analyser.actor.id}
		this.addHook(Events.Type.PREPARE, byPlayer, this.onPrepare)
		this.addHook(Events.Type.ACTION, byPlayer, this.onAction)
		this.addHook(EventTypes.COMPLETE, this.onComplete)
	}

	// Cooldown should begin at the start of preparation
	// (though few CDs have a cast time any more)
	private onPrepare(event: Events.Prepare) {
		const action = getDataBy(ACTIONS, 'id', event.actionId)
		if (!action || action.cooldown == null) { return }

		// Mark this action as being prepped
		this.currentAction = action

		// Start CD
		this.startCooldown(action)
	}

	// TODO: Consider pet CDs?
	private onAction(event: Events.Action) {
		const action = getDataBy(ACTIONS, 'id', event.actionId)
		if (!action || action.cooldown == null) { return }

		// Check if we're finishing a prep from earlier
		const finishingPrep = this.currentAction && this.currentAction.id === action.id
		this.currentAction = undefined

		// If we were finishing a prep, the CD's already been triggered
		if (finishingPrep) { return }

		// Start the CD
		this.startCooldown(action)
	}

	private onComplete() {
		// TODO: Cleanup & add to timeline
		// console.log(this.cooldowns)
	}

	/** Get the cooldown status for the provided action */
	getCooldown(action: Action): CooldownState {
		const cd = this.cooldowns.get(action.id)

		// If we don't have a record of it yet, create a new one and save it out
		if (!cd) {
			const newCd = {history: []}
			this.cooldowns.set(action.id, newCd)
			return newCd
		}

		// Check if current should be moved into the history
		if (
			cd.current &&
			cd.current.timestamp + cd.current.length < this.analyser.currentTime
		) {
			cd.history.push(cd.current)
			cd.current = undefined
		}

		return cd
	}

	/**
	 * Start the cooldown for the provided action, and any actions in the same
	 * cooldown group as it.
	 */
	startCooldown(action: Action) {
		// If there's no cooldown, something's gone haywire
		if (!action.cooldown) {
			throw new Error(`Tried to start cooldown for ${action.name}, which has no cooldown.`)
		}

		// Build the cooldown info
		const cooldown = {
			timestamp: this.analyser.currentTime,
			length: action.cooldown,
		}

		// Grab the rest of the cooldown group, if any
		const actions = action.cooldownGroup != null
			? [action, ...COOLDOWN_GROUPS[action.cooldownGroup]]
			: [action]

		// Start the CD for each of the actions in the group
		actions.forEach(action => {
			const cd = this.getCooldown(action)

			// If there's already a cooldown underway, move it to the history
			// TODO: Should this throw errors if there's an overlap?
			if (cd.current) {
				cd.history.push(cd.current)
			}

			// This is _intentionally_ not assigning a copy. In the reality of XIV,
			// _all_ cooldowns are part of a "group", even if that group only has one
			// action - and all actions within a group share their cooldown state.
			// This can be seen when switching jobs with stuff on CD.
			cd.current = cooldown
		})
	}

	/**
	 * Reduce the cooldown for the specified action by the given amount.
	 * If the reduction is greater than remaining time on the cooldown, it
	 * will be reset.
	 */
	reduceCooldown(action: Action, reduction: number) {
		const cd = this.getCooldown(action)

		// If there's no current CD, we have nothing to reduce
		if (!cd.current) {
			return
		}

		// Reduce the CD length
		// Bounded by 0 to prevent negative lengths, and the current timestamp, to
		// prevent reductions causing rifts in the time space continuum
		cd.current.length = Math.min(
			Math.max(cd.current.length - reduction, 0),
			this.analyser.currentTime - cd.current.timestamp,
		)
	}

	/** Reset the cooldown on the specified action */
	resetCooldown(action: Action) {
		this.reduceCooldown(action, Infinity)
	}

	// todo set invuln

	// todo get cd remaining

	// todo get time on cooldown

	// todo get adjusted

	// todo get used - unused - delet
}
