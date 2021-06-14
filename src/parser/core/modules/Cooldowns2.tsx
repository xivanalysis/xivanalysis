import Color from 'color'
import {Action} from 'data/ACTIONS'
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

	private currentCast?: Action['id']
	private groupStates = new Map<CooldownGroup, CooldownGroupState>()

	override initialise() {
		this.addEventHook(
			{type: 'prepare', source: this.parser.actor.id},
			this.onPrepare,
		)

		this.addEventHook(
			{type: 'interrupt', source: this.parser.actor.id},
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
		// TODO: This logic might make sense as a public "reset" helper.
		const activeConfigs = this.getActionConfigs(action)
			.filter(config => this.getGroupState(config).cooldown != null)
		for (const config of activeConfigs) {
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
		const chargeState = this.getGroupState(config).charges

		// If we're trying to consume a charge at 0 charges, something in the state
		// is very wrong (or the game is being dumb). At EOD, the parse is the source
		// of truth, so we're fudging the current charge state to respect it.
		if (chargeState.current <= 0) {
			this.debug(`Attempting to consume charge of group ${config.group} with no charges remaining, fudging.`)
			chargeState.current = 1
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
				content: '-',
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
				content: '+',
				start: now,
			}))
		})
	}

	private startCooldown(config: CooldownGroupConfig) {
		const groupState = this.getGroupState(config)

		// Check if this group is already on cooldown - this is technically impossible,
		// but Square Enix™️, so we fudge it by ending the overlapping groups with a warning.
		// TODO: Even with speed adjustments, CDGs like the GCD (58) have some seriously
		//       fuzzy timings in logs and cause considerable overlapping anyway. Look into it.
		const cooldownState = groupState.cooldown
		if (cooldownState != null) {
			this.debug(({log}) => {
				const now = this.parser.currentEpochTimestamp
				log(`Use of ${config.action.name} at ${this.parser.formatEpochTimestamp(now)} overlaps currently active group ${config.group} with expected expiry ${this.parser.formatEpochTimestamp(cooldownState.end)} (delta ${now - cooldownState.end})`)
			})

			this.endCooldown(config, CooldownEndReason.OVERLAPPED)
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
		const groups: CooldownGroupConfig[] = []

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
