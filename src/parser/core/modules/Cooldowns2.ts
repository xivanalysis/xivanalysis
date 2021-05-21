import {Action} from 'data/ACTIONS'
import {Events} from 'event'
import {Analyser} from '../Analyser'
import {TimestampHook} from '../Dispatcher'
import {dependency} from '../Injectable'
import {Data} from './Data'

const DEFAULT_CHARGES = 1

interface ChargeState {
	current: number
	maximum: number
}

interface CooldownState {
	end: number
	hook: TimestampHook
}

type CooldownGroup = Exclude<Action['cooldownGroup'], undefined>

export class Cooldowns extends Analyser {
	static handle = 'cooldowns2'

	// TODO: cooldownOrder

	@dependency private data!: Data

	private chargeStates = new Map<Action['id'], ChargeState>()
	private cooldownStates = new Map<CooldownGroup, CooldownState>()

	private actionMapping = {
		toGroups: new Map<Action['id'], CooldownGroup[]>(),
		fromGroup: new Map<CooldownGroup, Action[]>(),
	}

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

		// gain
		chargeState.current++

		// if we're sub max, kick off a cdg for the action
		// TODO: this is where we break the logic. cdg expires -> clear multiple actions which need to requeue -> multiple starts on the cdg.
		// that is back in the "shared cdg with 2+ actions with 2+ charges" world. do i give a siht? probably not...
		// leave a comment and let it error, come back if ever required?
		if (chargeState.current < chargeState.maximum) {
			this.startGroupsForAction(action)
		}
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
		if (this.cooldownStates.has(group)) {
			// TODO: broken log? or error?
			throw new Error('shit\'s fucked')
		}

		// build a new cooldown state
		const end = this.parser.currentEpochTimestamp + duration

		// configure a timestamp hook
		this.cooldownStates.set(group, {
			end,
			hook: this.addTimestampHook(end, () => {
				this.endCooldownGroup(group)
			}),
		})

		// save to history?
	}

	private endCooldownGroup(group: CooldownGroup) {
		// clear state
		const existed = this.cooldownStates.delete(group)
		// if there isn't anything in the state, shit's fucked
		if (!existed) {
			throw new Error('shit was def fucked')
		}

		// get list of actions associated with the expiring CDG
		const actions = this.actionMapping.fromGroup.get(group) ?? []
		for (const action of actions) {
			// increment charge count
			this.gainCharge(action)
		}
	}

	// TODO: inline?
	private getActionCooldownGroups(action: Action): CooldownGroup[] {
		// TODO: handle gcd group
		// TODO: prefill cdg. i neeeeeed to write an automated extraction
		// TODO: doc reasoning for neg (sep namespace etc)
		const group = action.cooldownGroup ?? -action.id
		return [group]
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
