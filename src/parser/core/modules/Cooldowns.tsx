import {Action, ActionKey} from 'data/ACTIONS'
import {Events} from 'event'
import {Analyser} from '../Analyser'
import {TimestampHook} from '../Dispatcher'
import {dependency} from '../Injectable'
import {Data} from './Data'
import {SpeedAdjustments} from './SpeedAdjustments'

const DEFAULT_CHARGES = 1
const GCD_CHARGES = 1
const GCD_COOLDOWN_GROUP = 58

// Game data is fudgy at the best of times - this constant represents the maximum
// amount of "expected" fudge time on cooldown overlapping that is worthless to report
const OVERLAP_NOISE_THRESHOLD = 50

/** Representative key of a cooldown group. */
export type CooldownGroup = Exclude<Action['cooldownGroup'], undefined>

/** Configuration for a single cooldown group on an action. */
interface CooldownGroupConfig {
	action: Action
	primary: boolean
	group: CooldownGroup
	duration: number
	maximumCharges: number
}

/**
 * Potential reasons for a group's cooldown to be ended. Encompasses both game-
 * truthful reasons and xiva-specific fudging.
 */
export enum CooldownEndReason {
	EXPIRED,
	INTERRUPTED,
	REDUCED,
	// Fudges
	PULL_ENDED,
	OVERLAPPED,
}

/** Historical representation of a single completed group cooldown. */
export interface CooldownHistoryEntry {
	action: Action
	start: number
	end: number
	endReason: CooldownEndReason
}

/** State of a group's cooldown. */
type CooldownState =
	& Omit<CooldownHistoryEntry, 'endReason'>
	& {
		hook: TimestampHook
	}

/** Point in time snapshot of a change to a group's charge state. */
export interface ChargeHistoryEntry {
	timestamp: number
	action: Action
	delta: number
	current: number
	maximum: number
}

/** State of a group's charges. */
type ChargeState =
	Omit<ChargeHistoryEntry, 'delta' | 'timestamp'>

/** Full state for a cooldown group. */
interface CooldownGroupState {
	cooldown?: CooldownState
	cooldownHistory: CooldownHistoryEntry[]
	charges: ChargeState
	chargeHistory: ChargeHistoryEntry[]
}

export type ActionSpecifier = Action | ActionKey
export type SelectionSpecifier = 'GCD' | CooldownGroup | ActionSpecifier

/** Options for selection of groups that should be read/modified by a method. */
export interface SelectionOptions {
	/** Retrieve data for only the primary group of an action. Default `true`. */
	primary: boolean
}

const DEFAULT_SELECTION_OPTIONS: SelectionOptions = {
	primary: true,
}

export class Cooldowns extends Analyser {
	static override handle = 'cooldowns'
	static override debug = false

	@dependency private data!: Data
	@dependency private speedAdjustments!: SpeedAdjustments

	// A few of the actions used as keys are ephemeral, using weak to prevent leaking references to them.
	private actionConfigCache = new WeakMap<Action, CooldownGroupConfig[]>()
	private currentCast?: Action['id']
	private groupStates = new Map<CooldownGroup, CooldownGroupState>()

	/**
	 * Get the cooldown group IDs for the specified action.
	 *
	 * @param specifier Selection specifier for groups who should be returned.
	 * @param options Options to select the groups to read.
	 */
	groups(specifier: SelectionSpecifier, options?: Partial<SelectionOptions>) {
		return Array.from(
			this.iterateStates(specifier, options),
			({config}) => config.group
		)
	}

	/** Get a list of all known cooldown group IDs. */
	allGroups() {
		return Array.from(this.groupStates.keys())
	}

	/**
	 * Get the remaining time on cooldown of the specified group, in milliseconds.
	 * If multiple groups are selected, the longest remaining cooldown will be returned.
	 *
	 * @param specifier Selection specifier for groups whose cooldown should be retrieved.
	 * @param options Options to select the groups to read.
	 */
	remaining(specifier: SelectionSpecifier, options?: Partial<SelectionOptions>) {
		let remaining = 0
		for (const {state: {cooldown}} of this.iterateStates(specifier, options)) {
			if (cooldown == null) { continue }

			remaining = Math.max(remaining, cooldown.end - this.parser.currentEpochTimestamp)
		}

		return remaining
	}

	/**
	 * Get the remaining charges of the specifiec action. If multiple groups are
	 * selected, the minimum remaining charges will be returned.
	 *
	 * @param specifier Selection specifier for groups whose charges should be retrieved.
	 * @param options Options to select the groups to read.
	 */
	charges(specifier: SelectionSpecifier, options?: Partial<SelectionOptions>) {
		const chargeValues = []
		for (const {state: {charges}} of this.iterateStates(specifier, options)) {
			chargeValues.push(charges.current)
		}

		return chargeValues.length > 0
			? Math.min(...chargeValues)
			: 0
	}

	/**
	 * Reduduce the remaining cooldown of groups associated with the specified
	 * action by a set duration.
	 *
	 * @param action The action whose groups should be reduced.
	 * @param reduction Duration in milliseconds that group cooldowns should be reduced by.
	 */
	reduce(action: ActionSpecifier, reduction: number, options?: Partial<SelectionOptions>) {
		for (const {config, state: {cooldown}} of this.iterateStates(action, options)) {
			// If this group isn't on CD, no need to attempt to reduce it
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
		}
	}

	/**
	 * Reset the cooldown on any active groups assocuited with the specified action.
	 *
	 * @param action The action whose groups should be reset.
	 * @param options Options to select the groups to modify.
	 */
	reset(action: ActionSpecifier, options?: Partial<SelectionOptions>) {
		for (const {config, state: {cooldown}} of this.iterateStates(action, options)) {
			if (cooldown == null) { continue }
			this.endCooldown(config, CooldownEndReason.REDUCED)
		}
	}

	/**
	 * Fetch the cooldown history of the specified action.
	 *
	 * @param specifier Selection specifier for group whose history should be retrieved.
	 * @param options Options to select the groups to retieve.
	 */
	cooldownHistory(specifier: SelectionSpecifier, options?: Partial<SelectionOptions>) {
		const histories: CooldownHistoryEntry[] = []
		for (const {state: {cooldownHistory}} of this.iterateStates(specifier, options)) {
			histories.push(...cooldownHistory)
		}
		histories.sort(
			(a, b) => a.start - b.start
		)
		return histories
	}

	/**
	 * Fetch the charge history of the specified action.
	 *
	 * @param specifier Selection specifier for group whose history should be retrieved.
	 * @param options Options to select the groups to retieve.
	 */
	chargeHistory(specifier: SelectionSpecifier, options?: Partial<SelectionOptions>) {
		const histories: ChargeHistoryEntry[] = []
		for (const {state: {chargeHistory}} of this.iterateStates(specifier, options)) {
			histories.push(...chargeHistory)
		}
		histories.sort(
			(a, b) => a.timestamp - b.timestamp
		)
		return histories
	}

	private *iterateStates(specifier: SelectionSpecifier, options?: Partial<SelectionOptions>) {
		let fullAction = specifier
		if (fullAction === 'GCD') {
			// Fabricating a fake GCD action
			fullAction = {
				...this.data.actions.UNKNOWN,
				onGcd: true,
			}
		} else if (typeof fullAction === 'number') {
			// Cooldown group
			fullAction = {
				...this.data.actions.UNKNOWN,
				cooldownGroup: fullAction,
			}
		} else if (typeof fullAction === 'string') {
			// Action key
			fullAction = this.data.actions[fullAction]
		}

		const opts: SelectionOptions = {...DEFAULT_SELECTION_OPTIONS, ...options}

		for (const config of this.getActionConfigs(fullAction)) {
			if (opts.primary && !config.primary) { continue }

			yield {config, state: this.getGroupState(config)}
		}
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
		for (const config of this.getActionConfigs(action)) {
			const state = this.getGroupState(config)
			if (state.cooldown == null) { continue }
			this.endCooldown(config, CooldownEndReason.INTERRUPTED)
		}
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
			primary: false,
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
		for (const config of this.getActionConfigs(action)) {
			this.consumeCharge(config)
		}
	}

	private consumeCharge(config: CooldownGroupConfig) {
		const groupState = this.getGroupState(config)
		const chargeState = groupState.charges

		const now = this.parser.currentEpochTimestamp

		// Check if we actually have a charge to consume. It's technically impossible for
		// this to trip, but the game (and log data) is fuzzy at the best of times, so it
		// actually occurs quite frequently. Blame Square Enix™️. Fudging by ending current
		// cooldown as an overlap to respect the log data and gain a charge to spend.
		// TODO: Even with speed adjustments, CDGs like the GCD (58) have some seriously
		//       fuzzy timings in logs and cause considerable overlapping. Look into it.
		if (chargeState.current <= 0) {
			// To be in the state of 0 charges, a cooldown _should_ be active. If it
			// isn't, something is _immensely_ wrong.
			const cooldownState = groupState.cooldown
			if (cooldownState == null) {
				throw new Error(`Attempted to consume charge of group ${config.group} at ${this.parser.formatEpochTimestamp(now)} with no charges remaining, and no active cooldown to fudge.`)
			}

			this.debug(({log}) => {
				const delta = cooldownState.end - now
				if (delta <= OVERLAP_NOISE_THRESHOLD) { return }

				log(`Use of ${config.action.name} at ${this.parser.formatEpochTimestamp(now)} consumes a charge of group ${config.group} with ${chargeState.current} charges. Expected charge gain at ${this.parser.formatEpochTimestamp(cooldownState.end)} (delta ${delta}), fudging.`)
			})

			this.endCooldown(config, CooldownEndReason.OVERLAPPED)
		}

		// If the group was at maximum charges, this usage will trip it's cooldown
		if (chargeState.current === chargeState.maximum) {
			this.startCooldown(config)
		}

		// Consume the charge and add to history
		chargeState.current--
		chargeState.action = config.action
		groupState.chargeHistory.push({
			...chargeState,
			timestamp: now,
			delta: -1,
		})
	}

	private gainCharge(config: CooldownGroupConfig) {
		// Get the current charge state for the group. If it's already at max, or
		// there's no state (implicitly max), we can noop.
		const {charges: chargeState, chargeHistory} = this.getGroupState(config)
		if (
			chargeState == null
			|| chargeState.current === chargeState.maximum
		) {
			return
		}

		// Add the charge and record
		chargeState.current++
		chargeHistory.push({
			...chargeState,
			timestamp: this.parser.currentEpochTimestamp,
			delta: +1,
		})

		// If there are still charges left to regenerate on the action, boot up
		// another cooldown for it.
		// TODO: This will break if ever there is a single CDG with 2+ actions in
		//       it, which have 2+ charges. The game does not currently contain
		//       anything which breaks this assumption.
		if (chargeState.current < chargeState.maximum) {
			this.startCooldown(config)
		}
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
			action: config.action,
			start,
			end,
			hook: this.addTimestampHook(end, () => {
				this.endCooldown(config, CooldownEndReason.EXPIRED)
			}),
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

		groupState.cooldownHistory.push({
			action: cooldownState.action,
			start: cooldownState.start,
			end: cooldownState.end,
			endReason: reason,
		})
	}

	private getGroupState(config: CooldownGroupConfig) {
		// Get the CDG's current state, fabricating a fresh one if none exists
		let groupState = this.groupStates.get(config.group)
		if (groupState == null) {
			const maximum = config.maximumCharges
			groupState = {
				cooldownHistory: [],
				charges: {
					action: this.data.actions.UNKNOWN,
					current: maximum,
					maximum,
				},
				chargeHistory: [],
			}
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
				primary: false,
				group: GCD_COOLDOWN_GROUP,
				duration: action.gcdRecast ?? action.cooldown,
				maximumCharges: GCD_CHARGES,
			})

			// GCDs with a seperate recast are part of two CDGs.
			if (action.gcdRecast == null) {
				groups[groups.length - 1].primary = true
				return groups
			}
		}

		// Include the action's CDG. If none is specified, use the action ID to fill
		// in (all actions must have 1+ CDGs from a game POV). Using negative to ensure
		// that fudged CDGs do not overlap with real data.
		groups.push({
			action,
			primary: true,
			group: action.cooldownGroup ?? -action.id,
			duration: action.cooldown,
			maximumCharges: action.charges ?? DEFAULT_CHARGES,
		})
		return groups
	}
}
