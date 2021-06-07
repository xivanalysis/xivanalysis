import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {BuffStackEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const SUGGESTION_TIERS = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

// Naive ding on bad actions, technically some AoE or normal GCD actions are bad too, adjust if people actually care
const PB_BAD_ACTIONS = [
	ACTIONS.FORM_SHIFT.id,
	ACTIONS.ANATMAN.id,
]

interface Balance {
	stacks: number
	bads: number
}

export default class PerfectBalance extends Module {
	static override debug = false
	static override handle = 'perfectBalance'
	static override title = t('mnk.pb.title')`Perfect Balance`
	static override displayOrder = DISPLAY_ORDER.PERFECT_BALANCE

	@dependency private combatants!: Combatants
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private current: Balance | undefined
	private history: Balance[] = []

	override init() {
		this.addEventHook('cast', {by: 'player'}, this.onCast)
		this.addEventHook('applybuffstack', {to: 'player', abilityId: PB_BAD_ACTIONS}, this.onStacc)
		this.addEventHook('removebuff', {to: 'player', abilityId: this.data.statuses.PERFECT_BALANCE.id}, this.onDrop)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent): void {
		const action = this.data.getAction(event.ability.guid)

		if (!action) {
			return
		}

		if (!action.onGcd) {
			return
		}

		if (this.current && this.combatants.selected.hasStatus(this.data.statuses.PERFECT_BALANCE.id)) {
			this.current.bads++
		}
	}

	private onStacc(event: BuffStackEvent): void {
		if (this.current) {
			this.current.stacks = event.stack
			return
		}

		// New window who dis
		if (event.stack === this.data.statuses.PERFECT_BALANCE.stacksApplied) {
			this.current = {bads: 0, stacks: event.stack}
			return
		}

		this.debug('New PB window with incorrect initial stacks')
	}

	private onDrop(): void {
		// If it's not current for some reason, something is wrong anyway
		if (this.current) {
			this.history.push(this.current)
		}

		this.current = undefined
	}

	private onComplete(): void {
		if (this.current) {
			this.history.push(this.current)

			this.current = undefined
		}

		// Stacks counts down, so drops+stacks will be adding remaining stacks that are unused
		const droppedGcds = this.history.reduce((drops, current) => drops + current.stacks, 0)
		const badActions = this.history.reduce((bads, current) => bads + current.bads, 0)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PERFECT_BALANCE.icon,
			content: <Trans id="mnk.pb.suggestions.stacks.content">
				Try to consume all 6 stacks during every <ActionLink {...this.data.actions.PERFECT_BALANCE} /> window.
			</Trans>,
			tiers: SUGGESTION_TIERS,
			value: droppedGcds,
			why: <Trans id="mnk.pb.suggestions.stacks.why">
				<Plural value={droppedGcds} one="# possible GCD was" other="# possible GCDs were" /> missed during <StatusLink {...this.data.statuses.PERFECT_BALANCE} />.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PERFECT_BALANCE.icon,
			content: <Trans id="mnk.pb.suggestions.badActions.content">
				Using <ActionLink {...this.data.actions.FORM_SHIFT} /> or <ActionLink {...this.data.actions.ANATMAN} /> inside of <StatusLink {...this.data.statuses.PERFECT_BALANCE} /> does no damage and does not change your Form.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
			},
			value: badActions,
			why: <Trans id="mnk.pb.suggestions.badActions.why">
				<Plural value={badActions} one="# use of" other="# uses of"/> uses of <ActionLink {...this.data.actions.FORM_SHIFT} /> or <ActionLink {...this.data.actions.ANATMAN} /> were used during <StatusLink {...this.data.statuses.PERFECT_BALANCE} />.
			</Trans>,
		}))
	}
}
