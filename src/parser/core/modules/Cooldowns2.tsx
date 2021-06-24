import Color from 'color'
import {Action, ActionKey} from 'data/ACTIONS'
import {Events} from 'event'
import React from 'react'
import {Analyser} from '../Analyser'
import {TimestampHook} from '../Dispatcher'
import {dependency} from '../Injectable'
import {Data} from './Data'
import {SpeedAdjustments} from './SpeedAdjustments'
import {SimpleItem, SimpleRow, Timeline} from './Timeline'

const DEFAULT_CHARGES = 1
const GCD_CHARGES = 1
const GCD_COOLDOWN_GROUP = 58

// Game data is fudgy at the best of times - this constant represents the maximum
// amount of "expected" fudge time on cooldown overlapping that is worthless to report
const OVERLAP_NOISE_THRESHOLD = 50

/** Representative key of a cooldown group. */
type CooldownGroup = Exclude<Action['cooldownGroup'], undefined>

/** Configuration for a single cooldown group on an action. */
interface CooldownGroupConfig {
	action: Action
	group: CooldownGroup
	duration: number
	maximumCharges: number
}

/** State of a group's cooldown. */
interface CooldownState {
	start: number
	end: number
	hook: TimestampHook
}

/** State of a group's charges. */
interface ChargeState {
	current: number
	maximum: number
}

/** Full state for a cooldown group. */
interface CooldownGroupState {
	cooldown?: CooldownState
	charges: ChargeState
}

/**
 * Potential reasons for a group's cooldown to be ended. Encompasses both game-
 * truthful reasons and xiva-specific fudging.
 */
enum CooldownEndReason {
	EXPIRED,
	INTERRUPTED,
	REDUCED,
	// Fudges
	PULL_ENDED,
	OVERLAPPED,
}

export class Cooldowns extends Analyser {
	static override handle = 'cooldowns2'
	static override debug = false

	// TODO: cooldownOrder

	@dependency private data!: Data
	@dependency private speedAdjustments!: SpeedAdjustments
	@dependency private timeline!: Timeline

	private actionConfigCache = new Map<Action, CooldownGroupConfig[]>()
	private currentCast?: Action['id']
	private groupStates = new Map<CooldownGroup, CooldownGroupState>()

	/**
	 * Get the remaining time on cooldown of the specified action, in milliseconds.
	 *
	 * @param action The action whose cooldown should be retrieved.
	 */
	remaining(action: Action | ActionKey) {
		// TODO: maybe data needs a .resolveAction or something
		const fullAction = typeof action === 'string' ? this.data.actions[action] : action
		const configs = this.getActionConfigs(fullAction)

		let remaining = 0
		for (const config of configs) {
			const {cooldown} = this.getGroupState(config)
			if (cooldown == null) { continue }

			remaining = Math.max(remaining, cooldown.end - this.parser.currentEpochTimestamp)
		}

		return remaining
	}

	/**
	 * Reduduce the remaining cooldown of groups associated with the specified
	 * action by a set duration.
	 *
	 * @param action The action whose groups should be reduced.
	 * @param reduction Duration in milliseconds that group cooldowns should be reduced by.
	 */
	reduce(action: Action | ActionKey, reduction: number) {
		const fullAction = typeof action === 'string' ? this.data.actions[action] : action

		const configs = this.getActionConfigs(fullAction)
		for (const config of configs) {
			// If this group isn't on CD, no need to attempt to reduce it
			const {cooldown} = this.getGroupState(config)
			if (cooldown == null) { continue }

			const newEnd = cooldown.end - reduction

			// If the new end time is in the past (or precisely now), the reduction
			// behaves like a reset with all the charge logic involved in that.
			if (newEnd <= this.parser.currentEpochTimestamp) {
				this.endCooldown(config, CooldownEndReason.REDUCED)
				continue
			}

			// Otherwise, we need to adjust the expected end time and reconfigure the hook
			cooldown.end = newEnd
			this.removeTimestampHook(cooldown.hook)
			cooldown.hook = this.addTimestampHook(newEnd, () => {
				this.endCooldown(config, CooldownEndReason.EXPIRED)
			})

			const row = this.tempGetTimelineRow(`group:${config.group}`)
			row.addItem(new SimpleItem({
				start: this.parser.currentEpochTimestamp - this.parser.pull.timestamp,
				content: `r ${(cooldown.end - cooldown.start)/1000}`,
			}))
		}
	}

	/**
	 * Reset the cooldown on any active groups assocuited with the specified action.
	 *
	 * @param action The action whose groups should be reset.
	 */
	reset(action: Action | ActionKey) {
		const fullAction = typeof action === 'string' ? this.data.actions[action] : action
		this.endActionCooldowns(fullAction, CooldownEndReason.REDUCED)
	}

	override initialise() {
		this.addEventHook(
			{type: 'prepare', source: this.parser.actor.id},
			this.onPrepare,
		)

		this.addEventHook(
			{type: 'interrupt', target: this.parser.actor.id},
			this.onInterrupt,
		)

		this.addEventHook(
			{type: 'action', source: this.parser.actor.id},
			this.onAction,
		)

		this.addEventHook('complete', this.onComplete)
	}

	private onPrepare(event: Events['prepare']) {
		this.currentCast = event.action

		const action = this.data.getAction(event.action)
		if (action == null) { return }

		// This is, for the sake of simplicity, assuming that charges are consumed
		// on prepare. As it stands, no 2+ charge action actually has a cast time,
		// so this is a pretty-safe assumption. Revisit if this ever changes.
		this.useAction(action)
	}

	private onInterrupt(event: Events['interrupt']) {
		// If the interrupt doesn't match the current cast, something has gone very wrong
		if (this.currentCast !== event.action) {
			// TODO: Broken log?
			throw new Error('Interrupted action does not match expected current cast.')
		}

		// Clear out current cast state
		this.currentCast = undefined

		const action = this.data.getAction(event.action)
		if (action == null) { return }

		// Reset cooldown for any of the interrupted cast's groups that are currently
		// active. We avoid inactive ones explicitly, as it's possible to interrupt
		// a cast beyond the end of all related cooldown groups (i.e. rdm long casts).
		// NOTE: This assumes that interrupting casts refunds charges. Given that,
		//       at current, there are no multi-charge or non-gcd interruptible
		//       skills, this is a safe assumption. Re-evaluate if the above changes.
		this.endActionCooldowns(action, CooldownEndReason.INTERRUPTED)
	}

	private onAction(event: Events['action']) {
		// Clear out any current casting state. If we're finishing a cast that's
		// already been tracked, noop.
		const currentCast = this.currentCast
		this.currentCast = undefined
		if (currentCast === event.action) {
			return
		}

		const action = this.data.getAction(event.action)
		if (action == null) { return }

		this.useAction(action)
	}

	private onComplete() {
		// Clean up any cooldown groups that are still active
		// Using fake group config, as it's pretty irrelevant at this point of the run
		const baseConfig = {
			action: this.data.actions.UNKNOWN,
			duration: 0,
			maximumCharges: DEFAULT_CHARGES,
		}

		for (const [group, state] of this.groupStates.entries()) {
			if (state.cooldown == null) { continue }
			this.resolveCooldown(
				{group, ...baseConfig},
				CooldownEndReason.PULL_ENDED
			)
		}
	}

	private useAction(action: Action) {
		// TODO: precompute?
		const configs = this.getActionConfigs(action)
		for (const config of configs) {
			this.consumeCharge(config)
		}
	}

	private consumeCharge(config: CooldownGroupConfig) {
		const groupState = this.getGroupState(config)
		const chargeState = groupState.charges

		// Check if we actually have a charge to consume. It's technically impossible for
		// this to trip, but the game (and log data) is fuzzy at the best of times, so it
		// actually occurs quite frequently. Blame Square Enix™️. Fudging by ending current
		// cooldown as an overlap to respect the log data and gain a charge to spend.
		// TODO: Even with speed adjustments, CDGs like the GCD (58) have some seriously
		//       fuzzy timings in logs and cause considerable overlapping. Look into it.
		if (chargeState.current <= 0) {
			const now = this.parser.currentEpochTimestamp

			// To be in the state of 0 charges, a cooldown _should_ be active. If it
			// isn't, something is _immensely_ wrong.
			const cooldownState = groupState.cooldown
			if (cooldownState == null) {
				throw new Error(`Attempted to consume charge of group ${config.group} at ${this.parser.formatEpochTimestamp(now)} with no charges remaining, and no active cooldown to fudge.`)
			}

			const delta = cooldownState.end - now
			if (delta > OVERLAP_NOISE_THRESHOLD) {
				this.debug(({log}) => {
					log(`Use of ${config.action.name} at ${this.parser.formatEpochTimestamp(now)} consumes a charge of group ${config.group} with ${chargeState.current} charges. Expected charge gain at ${this.parser.formatEpochTimestamp(cooldownState.end)} (delta ${delta}), fudging.`)
				})
			}

			this.endCooldown(config, CooldownEndReason.OVERLAPPED)
		}

		// If the group was at maximum charges, this usage will trip it's cooldown
		if (chargeState.current === chargeState.maximum) {
			this.startCooldown(config)
		}

		// Consume the charge
		chargeState.current--

		// TEMP
		this.debug(() => {
			const now = this.parser.currentEpochTimestamp - this.parser.pull.timestamp
			const row = this.tempGetTimelineRow(`group:${config.group}`)
			row.addItem(new SimpleItem({
				content: `- ${chargeState.current}`,
				start: now,
			}))
		})
	}

	private gainCharge(config: CooldownGroupConfig) {
		// Get the current charge state for the group. If it's already at max, or
		// there's no state (implicitly max), we can noop.
		const chargeState = this.getGroupState(config).charges
		if (
			chargeState == null
			|| chargeState.current === chargeState.maximum
		) {
			return
		}

		// Add the charge
		chargeState.current++

		// If there are still charges left to regenerate on the action, boot up
		// another cooldown for it.
		// TODO: This will break if ever there is a single CDG with 2+ actions in
		//       it, which have 2+ charges. The game does not currently contain
		//       anything which breaks this assumption.
		if (chargeState.current < chargeState.maximum) {
			this.startCooldown(config)
		}

		// TEMP
		this.debug(() => {
			const now = this.parser.currentEpochTimestamp - this.parser.pull.timestamp
			const row = this.tempGetTimelineRow(`group:${config.group}`)
			row.addItem(new SimpleItem({
				content: `+ ${chargeState.current}`,
				start: now,
			}))
		})
	}

	private startCooldown(config: CooldownGroupConfig) {
		const groupState = this.getGroupState(config)

		// Groups only track one cooldown at a time. Any overlapping should be
		// resolved by charge consumption logic.
		const cooldownState = groupState.cooldown
		if (cooldownState != null) {
			throw new Error(`Cannot start cooldown for already-active group ${config.group} at ${this.parser.formatEpochTimestamp(this.parser.currentEpochTimestamp)}.`)
		}

		// Calculate an adjusted duration based on the triggering action
		let duration = config.duration
		if (config.action.speedAttribute != null) {
			duration = this.speedAdjustments.getAdjustedDuration({
				duration,
				attribute: config.action.speedAttribute,
			})
		}

		// Save cooldown info into the state
		const start = this.parser.currentEpochTimestamp
		const end = start + duration
		groupState.cooldown = {
			start,
			end,
			hook: this.addTimestampHook(end, () => {
				this.endCooldown(config, CooldownEndReason.EXPIRED)
			}),
		}
	}

	private endActionCooldowns(action: Action, reason: CooldownEndReason) {
		// Find any active cooldowns for the action and end them
		for (const config of this.getActionConfigs(action)) {
			const state = this.getGroupState(config)
			if (state.cooldown == null) { continue }
			this.endCooldown(config, reason)
		}
	}

	private endCooldown(config: CooldownGroupConfig, reason: CooldownEndReason) {
		this.resolveCooldown(config, reason)

		// The cooldown ended, we can regenerate a charge on it.
		this.gainCharge(config)
	}

	private resolveCooldown(config: CooldownGroupConfig, reason: CooldownEndReason) {
		// Grab the current cooldown state for the group - if there is none, something
		// has gone pretty wrong.
		const groupState = this.getGroupState(config)
		const cooldownState = groupState.cooldown
		if (cooldownState == null) {
			throw new Error(`Trying to end cooldown for group ${config.group} which has no current state.`)
		}

		// Clear the state out of shared structures and update the end to match the
		// current timestamp (will be a noop if CDG expired uneventfully).
		groupState.cooldown = undefined
		this.removeTimestampHook(cooldownState.hook)
		cooldownState.end = this.parser.currentEpochTimestamp

		// TEMP
		this.debug(() => {
			const color = reason === CooldownEndReason.INTERRUPTED
				? Color('red')
				: Color('green')
			const row = this.tempGetTimelineRow(`group:${config.group}`)
			row.addItem(new SimpleItem({
				content: <div style={{width: '100%', height: '100%', background: color.alpha(0.25).toString(), borderLeft: `1px solid ${color}`}}/>,
				start: cooldownState.start - this.parser.pull.timestamp,
				end: cooldownState.end - this.parser.pull.timestamp,
			}))
		})
	}

	private getGroupState(config: CooldownGroupConfig) {
		// Get the CDG's current state, fabricating a fresh one if none exists
		let groupState = this.groupStates.get(config.group)
		if (groupState == null) {
			const maximum = config.maximumCharges
			groupState = {charges: {
				current: maximum,
				maximum,
			}}
			this.groupStates.set(config.group, groupState)
		}
		return groupState
	}

	private getActionConfigs(action: Action): CooldownGroupConfig[] {
		// TODO: Write automated CDG extraction from the data files, current data
		//       is pretty dumb about this stuff.
		let groups = this.actionConfigCache.get(action)
		if (groups != null) {
			return groups
		}
		groups = []
		this.actionConfigCache.set(action, groups)

		// If the action has no cooldown at all (technically impossible), we can't
		// track cooldowns for it.
		if (action.cooldown == null) { return groups }

		// GCDs all share a CDG.
		if (action.onGcd) {
			groups.push({
				action,
				group: GCD_COOLDOWN_GROUP,
				duration: action.gcdRecast ?? action.cooldown,
				maximumCharges: GCD_CHARGES,
			})

			// GCDs with a seperate recast are part of two CDGs.
			if (action.gcdRecast == null) {
				return groups
			}
		}

		// Include the action's CDG. If none is specified, use the action ID to fill
		// in (all actions must have 1+ CDGs from a game POV). Using negative to ensure
		// that fudged CDGs do not overlap with real data.
		groups.push({
			action,
			group: action.cooldownGroup ?? -action.id,
			duration: action.cooldown,
			maximumCharges: action.charges ?? DEFAULT_CHARGES,
		})
		return groups
	}

	private tempTimelineRow = this.timeline.addRow(new SimpleRow({label: 'cd2 temp'}))
	private tempRows = new Map<string, SimpleRow>()
	private tempGetTimelineRow(key:string) {
		let row = this.tempRows.get(key)
		if (row == null) {
			row = this.tempTimelineRow.addRow(new SimpleRow({label: key}))
			this.tempRows.set(key, row)
		}
		return row
	}
}
