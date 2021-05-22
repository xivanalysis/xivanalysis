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

	// TODO: cooldownOrder

	@dependency private data!: Data
	@dependency private timeline!: Timeline

	private chargeStates = new Map<Action['id'], ChargeState>()
	private cooldownStates = new Map<CooldownGroup, CooldownState>()

	private actionMapping = {
		toGroups: new Map<Action['id'], CooldownGroup[]>(),
		fromGroup: new Map<CooldownGroup, Action[]>(),
	}

	private tempTimelineRow = this.timeline.addRow(new SimpleRow({label: 'cd2 temp'}))

	initialise() {
		// TODO: doc fucking shit
		// TODO: clean up
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
			{type: 'action', source: this.parser.actor.id},
			this.onAction,
		)
		// this.addEventHook('complete', () => console.log('complte'))
	}

	// TODO: inline?
	private onAction(event: Events['action']) {
		const action = this.data.getAction(event.action)
		if (action == null) { return }

		// uuuh, doc reason? basically can't consume a charge if there's no way to restore it
		const cooldown = action.cooldown
		if (cooldown == null) { return }

		// do thing
		this.consumeCharge(action)
	}

	// TODO: consider further. thinking that we should treat _every_ action as a charge action - defaulting to one charge.
	private consumeCharge(action: Action) {
		// TODO: possibly abstract "get charge state" to method - we might reuse in other CD tracking?
		// get current charge status for the action
		let chargeState = this.chargeStates.get(action.id)

		// if there's no state, prefill with a pristine unused state
		if (chargeState == null) {
			const maximum = action.charges ?? DEFAULT_CHARGES
			chargeState = {
				current: maximum,
				maximum,
			}
			this.chargeStates.set(action.id, chargeState)
		}

		// TODO: bounds check > 0? what does a fail on this mean?

		// if charges are at maximum, we need to start the cooldown timer
		if (chargeState.current === chargeState.maximum) {
			this.startGroupsForAction(action)
		}

		// consume a charge
		// TODO: enable
		chargeState.current--

		// save to history in some manner? we need to track this shit in the timeline as well
		// TEMP
		const now = this.parser.currentEpochTimestamp - this.parser.pull.timestamp
		const row = this.tempGetTimelineRow(`charge:${action.name}`)
		row.addItem(new SimpleItem({
			content: '-',
			start: now,
		}))
	}

	private gainCharge(action: Action) {
		const chargeState = this.chargeStates.get(action.id)

		// if there's no charge state we can't reasonably recharge what doesn't exist
		// the mapping group -> action _will_ contain cross-job shit, which we're not tracking
		if (chargeState == null) {
			// debugger
			// throw new Error('shit is yet again fucked')
			return
		}

		// TODO: bounds check < max - what does a fail _here_ mean?
		// akkthoughts: realistically, not much? a cdg gaining a charge past max is just... what happens?
		if (chargeState.current === chargeState.maximum) {
			return
		}

		// gain
		chargeState.current++

		// if we're sub max, kick off a cdg for the action
		// TODO: this is where we break the logic. cdg expires -> clear multiple actions which need to requeue -> multiple starts on the cdg.
		// that is back in the "shared cdg with 2+ actions with 2+ charges" world. do i give a siht? probably not...
		// leave a comment and let it error, come back if ever required?
		if (chargeState.current < chargeState.maximum) {
			this.startGroupsForAction(action)
		}

		// mark history
		// temp
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

		const groups = this.actionMapping.toGroups.get(action.id) ?? []
		for (const group of groups) {
			this.startCooldownGroup(group, cooldown)
		}
	}

	private startCooldownGroup(group: CooldownGroup, duration: number) {
		// if there's a current state then shit's fucked
		// todo: note about gcd shit/speed stat / fix soon :tm:
		const cooldownState = this.cooldownStates.get(group)
		if (cooldownState != null) {
			console.log('fuck', group, cooldownState.end, this.parser.currentEpochTimestamp)
			this.endCooldownGroup(group)

			// TODO: broken log? or error?
			// throw new Error('shit\'s fucked')
		}

		// build a new cooldown state
		const start = this.parser.currentEpochTimestamp
		const end = start + duration

		// configure a timestamp hook
		this.cooldownStates.set(group, {
			start,
			end,
			hook: this.addTimestampHook(end, () => {
				this.endCooldownGroup(group)
			}),
		})

		// save to history?
	}

	private endCooldownGroup(group: CooldownGroup) {
		// clear state
		const cooldownState = this.cooldownStates.get(group)
		// if there isn't anything in the state, shit's fucked
		if (cooldownState == null) {
			throw new Error('shit was def fucked')
		}
		this.cooldownStates.delete(group)
		// words
		cooldownState.end = this.parser.currentEpochTimestamp
		this.removeTimestampHook(cooldownState.hook)

		// get list of actions associated with the expiring CDG
		const actions = this.actionMapping.fromGroup.get(group) ?? []
		for (const action of actions) {
			// increment charge count
			this.gainCharge(action)
		}

		const row = this.tempGetTimelineRow(`group:${group}`)
		row.addItem(new SimpleItem({
			content: <div style={{width: '100%', height: '100%', background: '#ff000033'}}/>,
			start: cooldownState.start - this.parser.pull.timestamp,
			end: cooldownState.end - this.parser.pull.timestamp,
		}))
	}

	// TODO: inline?
	private getActionCooldownGroups(action: Action): CooldownGroup[] {
		// TODO: prefill cdg. i neeeeeed to write an automated extraction
		const groups: CooldownGroup[] = []

		if (action.onGcd) {
			groups.push(GCD_COOLDOWN_GROUP)
			if (action.gcdRecast == null) {
				return groups
			}
		}

		// TODO: doc reasoning for neg (sep namespace etc)
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

/*
shit we need:
action ID -> charge status
cooldown group -> cooldown status

when cdg cd expires, +1 charge for all actions mapped, hence require
cdg -> action id[]
in some manner

if max charges > 1, incrementing charge should retrip cdg cd
currently not in-game, but what about 2+ actions on same cdg with 2+ charges and diff CDs?
probably just throw a warning of some kind, i guess? error?
*/
