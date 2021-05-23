import {Action} from 'data/ACTIONS'
import {Events} from 'event'
import React from 'react'
import {Analyser} from '../Analyser'
import {TimestampHook} from '../Dispatcher'
import {dependency} from '../Injectable'
import {Data} from './Data'
import {SimpleItem, SimpleRow, Timeline} from './Timeline'

const DEFAULT_CHARGES = 1
const GCD_COOLDOWN_GROUP = 58

interface ChargeState {
	current: number
	maximum: number
}

interface CooldownState {
	start: number
	end: number
	hook: TimestampHook
}

type CooldownGroup = Exclude<Action['cooldownGroup'], undefined>

export class Cooldowns extends Analyser {
	static handle = 'cooldowns2'
	static debug = true

	// TODO: cooldownOrder

	@dependency private data!: Data
	@dependency private timeline!: Timeline

	private currentCast?: Action['id']
	private chargeStates = new Map<Action['id'], ChargeState>()
	private cooldownStates = new Map<CooldownGroup, CooldownState>()

	private actionMapping = {
		toGroups: new Map<Action['id'], CooldownGroup[]>(),
		fromGroup: new Map<CooldownGroup, Action[]>(),
	}

	private tempTimelineRow = this.timeline.addRow(new SimpleRow({label: 'cd2 temp'}))

	initialise() {
		// Preemptively build a two-directional mapping between actions and cooldown groups
		for (const action of Object.values(this.data.actions)) {
			const toGroup: CooldownGroup[] = []
			this.actionMapping.toGroups.set(action.id, toGroup)

			for (const group of this.getActionCooldownGroups(action)) {
				toGroup.push(group)

				let fromGroup = this.actionMapping.fromGroup.get(group)
				if (fromGroup == null) {
					fromGroup = []
					this.actionMapping.fromGroup.set(group, fromGroup)
				}

				fromGroup.push(action)
			}
		}

		this.addEventHook(
			{type: 'prepare', source: this.parser.actor.id},
			this.onPrepare,
		)

		this.addEventHook(
			{type: 'action', source: this.parser.actor.id},
			this.onAction,
		)
	}

	private onPrepare(event: Events['prepare']) {
		const action = this.data.getAction(event.action)
		if (action == null) { return }

		// This is, for the sake of simplicity, assuming that charges are consumed
		// on prepare. As it stands, no 2+ charge action actually has a cast time,
		// so this is a pretty-safe assumption. Revisit if this ever changes.
		// TODO: How will this play alongside interrupts?
		this.currentCast = event.action
		this.consumeCharge(action)
	}

	private onAction(event: Events['action']) {
		// Clear out any current casting state. If we're finishing a cast that's
		// already been tracked, noop.
		// TODO: Work out how this will interact with interrupts.
		const currentCast = this.currentCast
		this.currentCast = undefined
		if (currentCast === event.action) {
			return
		}

		const action = this.data.getAction(event.action)
		if (action == null) { return }

		this.consumeCharge(action)
	}

	private consumeCharge(action: Action) {
		// Shouldn't consume a charge if there's no way to then regenerate it.
		// Realistically, almost everything should have a CD defined.
		const cooldown = action.cooldown
		if (cooldown == null) { return }

		// TODO: possibly abstract "get charge state" to method - we might reuse in other CD tracking?
		// Get the current charge state for the action, filling with pristine state if none exists
		let chargeState = this.chargeStates.get(action.id)
		if (chargeState == null) {
			const maximum = action.charges ?? DEFAULT_CHARGES
			chargeState = {
				current: maximum,
				maximum,
			}
			this.chargeStates.set(action.id, chargeState)
		}

		// If we're trying to consume a charge at 0 charges, something in the state is very wrong.
		if (chargeState.current === 0) {
			// TODO: Possibly worth just raising a broken log and nooping this function?
			// TODO: Currently, this will break on parses with sub-2.5 GCDs that chain the same GCD twice in a row.
			//       Should be fixed by GCD/CastTime calcs, but _may_ not be. Check.
			// throw new Error('Attempting to consume charge with 0 available.')
			return
		}

		// If the action was at maximum charges, this usage will trip it's cooldown
		if (chargeState.current === chargeState.maximum) {
			this.startGroupsForAction(action)
		}

		// Consume the charge
		chargeState.current--

		// TEMP
		const now = this.parser.currentEpochTimestamp - this.parser.pull.timestamp
		const row = this.tempGetTimelineRow(`charge:${action.name}`)
		row.addItem(new SimpleItem({
			content: '-',
			start: now,
		}))
	}

	private gainCharge(action: Action) {
		// Get the current charge state for the action. If it's already at max, or
		// there's no state (implicitly max), we can noop.
		const chargeState = this.chargeStates.get(action.id)
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
			this.startGroupsForAction(action)
		}

		// TEMP
		const now = this.parser.currentEpochTimestamp - this.parser.pull.timestamp
		const row = this.tempGetTimelineRow(`charge:${action.name}`)
		row.addItem(new SimpleItem({
			content: '+',
			start: now,
		}))
	}

	private startGroupsForAction(action: Action) {
		// Can't start groups if the action has no cooldown to start
		// TODO: Is... this even possible? Should this throw?
		const cooldown = action.cooldown
		if (cooldown == null) { return }

		// TODO: Some cooldowns (GCD, GF, etc) should have their cooldown modified
		//       by the relevant speed attribute value.

		const groups = this.actionMapping.toGroups.get(action.id) ?? []
		for (const group of groups) {
			this.startCooldownGroup(group, cooldown)
		}
	}

	private startCooldownGroup(group: CooldownGroup, duration: number) {
		// If there is an existing cooldown state for the action, something has gone
		// wrong (cooldowns on a group do not overlap).
		// TODO: This is currently fudging with an endCooldownGroup. Once GCD and
		//       cast time are integrated with this module, this fudging should be
		//       re-examined for sanity.
		const cooldownState = this.cooldownStates.get(group)
		if (cooldownState != null) {
			this.debug(`Overlapping cooldown windows: Group ${group} expected end at ${this.parser.formatEpochTimestamp(cooldownState.end)}, got start at ${this.parser.formatEpochTimestamp(this.parser.currentEpochTimestamp)}.`)
			this.endCooldownGroup(group)
		}

		// Build a new cooldown state and save it out
		const start = this.parser.currentEpochTimestamp
		const end = start + duration
		this.cooldownStates.set(group, {
			start,
			end,
			hook: this.addTimestampHook(end, () => {
				this.endCooldownGroup(group)
			}),
		})
	}

	private endCooldownGroup(group: CooldownGroup) {
		// Grab the current cooldown state for the group - if there is none, something
		// has gone pretty wrong.
		const cooldownState = this.cooldownStates.get(group)
		if (cooldownState == null) {
			throw new Error(`Trying to end cooldown for group ${group} which has no current state.`)
		}

		// Clear the state out of shared structures and update the end to match the
		// current timestamp (will be a noop if CDG expired uneventfully).
		this.cooldownStates.delete(group)
		this.removeTimestampHook(cooldownState.hook)
		cooldownState.end = this.parser.currentEpochTimestamp

		// On expiration of a CDG, all associated actions gain a charge.
		// TODO: Consider perf of this on the GCD group - it's going to be looping
		//       through every GCD in data only to noop most of them. Reverse the loop?
		const actions = this.actionMapping.fromGroup.get(group) ?? []
		for (const action of actions) {
			this.gainCharge(action)
		}

		// TEMP
		const row = this.tempGetTimelineRow(`group:${group}`)
		row.addItem(new SimpleItem({
			content: <div style={{width: '100%', height: '100%', background: '#ff000033'}}/>,
			start: cooldownState.start - this.parser.pull.timestamp,
			end: cooldownState.end - this.parser.pull.timestamp,
		}))
	}

	private getActionCooldownGroups(action: Action): CooldownGroup[] {
		// TODO: Write automated CDG extraction from the data files, current data
		//       is pretty dumb about this stuff.
		const groups: CooldownGroup[] = []

		// GCDs all share a CDG.
		if (action.onGcd) {
			groups.push(GCD_COOLDOWN_GROUP)
			// GCDs with a seperate recast are part of two CDGs.
			if (action.gcdRecast == null) {
				return groups
			}
		}

		// Include the action's CDG. If none is specified, use the action ID to fill
		// in (all actions must have 1+ CDGs from a game POV). Using negative to ensure
		// that fudged CDGs do not overlap with real data.
		groups.push(action.cooldownGroup ?? -action.id)
		return groups
	}

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
