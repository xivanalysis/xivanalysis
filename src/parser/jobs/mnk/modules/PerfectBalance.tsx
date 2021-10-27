import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionRoot} from 'data/ACTIONS/root'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import {FillActions} from './utilities'

const SUGGESTION_TIERS = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

// Naive ding on bad actions, technically some AoE or normal GCD actions are bad too, adjust if people actually care
const PB_BAD_ACTIONS: Array<keyof ActionRoot> = [
	'FORM_SHIFT',
	'ANATMAN',
]

interface Balance {
	stacks: number
	bads: number
}

export class PerfectBalance extends Analyser {
	static override debug = false
	static override handle = 'perfectBalance'
	static override title = t('mnk.pb.title')`Perfect Balance`
	static override displayOrder = DISPLAY_ORDER.PERFECT_BALANCE

	@dependency private actors!: Actors
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private badActions: number[] = []
	private current: Balance | undefined
	private history: Balance[] = []
	private perfectHook?: EventHook<Events['action']>

	override initialise() {
		this.badActions = FillActions(PB_BAD_ACTIONS, this.data)

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.PERFECT_BALANCE.id), this.onStacc)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.PERFECT_BALANCE.id), this.onDrop)

		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: Events['action']): void {
		const action = this.data.getAction(event.action)

		if (!action?.onGcd) {
			return
		}

		if (this.current && this.actors.current.hasStatus(this.data.statuses.PERFECT_BALANCE.id)) {
			this.current.bads++
		}
	}

	private onStacc(event: Events['statusApply']): void {
		// Bail early if no stacks
		if (event.data == null) { return }

		// New window who dis - check for new window before updating just in case
		if (event.data === this.data.statuses.PERFECT_BALANCE.stacksApplied) {
			this.current = {bads: 0, stacks: event.data}

			// Create the hook to check GCDs in PB
			this.perfectHook = this.addEventHook(filter<Event>()
				.source(this.parser.actor.id)
				.type('action')
				.action(oneOf(this.badActions))
			, this.onCast)

			return
		}

		// Update stacks for existing window
		if (this.current != null) {
			this.current.stacks = event.data
			return
		}

		// We should have returned by now, so debug if not
		this.debug('New PB window with incorrect initial stacks')
	}

	private onDrop(): void {
		this.stopAndSave()
	}

	private stopAndSave(): void {
		// If it's not current for some reason, something is wrong anyway
		if (this.current != null) {
			this.history.push(this.current)

			if (this.perfectHook != null) {
				this.removeEventHook(this.perfectHook)
				this.perfectHook = undefined
			}
		}

		this.current = undefined
	}

	private onComplete(): void {
		if (this.current != null) { this.stopAndSave() }

		// Stacks counts down, so drops+stacks will be adding remaining stacks that are unused
		const droppedGcds = this.history.reduce((drops, current) => drops + current.stacks, 0)
		const badActions = this.history.reduce((bads, current) => bads + current.bads, 0)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PERFECT_BALANCE.icon,
			content: <Trans id="mnk.pb.suggestions.stacks.content">
				Try to consume all 6 stacks during every <DataLink action="PERFECT_BALANCE"/> window.
			</Trans>,
			tiers: SUGGESTION_TIERS,
			value: droppedGcds,
			why: <Trans id="mnk.pb.suggestions.stacks.why">
				<Plural value={droppedGcds} one="# possible GCD was" other="# possible GCDs were" /> missed during <DataLink status="PERFECT_BALANCE"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PERFECT_BALANCE.icon,
			content: <Trans id="mnk.pb.suggestions.badActions.content">
				Using <DataLink action="FORM_SHIFT"/> or <DataLink action="ANATMAN"/> inside of <DataLink status="PERFECT_BALANCE"/> does no damage and does not change your Form.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
			},
			value: badActions,
			why: <Trans id="mnk.pb.suggestions.badActions.why">
				<Plural value={badActions} one="# use of" other="# uses of"/> uses of <DataLink action="FORM_SHIFT"/> or <DataLink action="ANATMAN"/> were used during <DataLink status="PERFECT_BALANCE"/>.
			</Trans>,
		}))
	}
}
