import {Plural, Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Combatants from 'parser/core/modules/Combatants'
import Enemies from 'parser/core/modules/Enemies'
import Invulnerability from 'parser/core/modules/Invulnerability'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const GCD_CYCLE_LENGTH = 6

const REFRESHERS = [
	STATUSES.TWIN_SNAKES.id,
]

export default class BuffUptime extends Module {
	static handle = 'BuffUptime'

	@dependency private checklist!: Checklist
	@dependency private combatants!: Combatants
	@dependency private enemies!: Enemies
	@dependency private invuln!: Invulnerability
	@dependency private suggestions!: Suggestions

	private lastTwinSnakesUse?: number
	private earlyTwinSnakes: number = 0
	private gcdsSinceTS: number = 0

	protected init() {
		// Hook all GCDs so we can count GCDs in buff windows
		this.addHook('cast', {by: 'player'}, this.onCast)

		this.addHook('applybuff', {to: 'player', abilityId: STATUSES.TWIN_SNAKES.id}, this.onGain)
		this.addHook('refreshbuff', {to: 'player', abilityId: REFRESHERS}, this.onRefresh)

		this.addHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent): void {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid) as TODO

		if (!action) {
			return
		}

		// Only include GCDs, but don't double increment either
		if (action.onGcd && this.lastTwinSnakesUse && !REFRESHERS.includes(action)) {
			this.gcdsSinceTS++
		}
	}

	private onGain(event: BuffEvent): void {
		// If it's not been applied yet set it and skip out
		if (this.lastTwinSnakesUse) {
			this.lastTwinSnakesUse = event.timestamp
			return
		}

		// Only on Gain since we expect AoE to extend
		// Needs a rework for duration rather than GCDs since it's stricter now
		if (this.gcdsSinceTS < GCD_CYCLE_LENGTH) {
			this.earlyTwinSnakes++
		}

		this.lastTwinSnakesUse = event.timestamp
		this.gcdsSinceTS = 0
	}

	private onRefresh(event: BuffEvent): void {
		this.lastTwinSnakesUse = event.timestamp
		this.gcdsSinceTS = 0
	}

	private onComplete() {
		const lostTruePotency = this.earlyTwinSnakes * (ACTIONS.TRUE_STRIKE.potency - ACTIONS.TWIN_SNAKES.potency)

		this.checklist.add(new Rule({
			name: <Trans id="mnk.buffs.checklist.twinsnakes.name">Keep Twin Snakes up</Trans>,
			description: <Trans id="mnk.buffs.checklist.twinsnakes.description">Twin Snakes is an easy 10% buff to your DPS across the board.</Trans>,
			displayOrder: DISPLAY_ORDER.TWIN_SNAKES,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.buffs.checklist.twinsnakes.requirement.name"><ActionLink {...ACTIONS.TWIN_SNAKES} /> uptime</Trans>,
					percent: () => this.getBuffUptimePercent(STATUSES.TWIN_SNAKES.id),
				}),
			],
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.TWIN_SNAKES.icon,
			content: <Trans id="mnk.buffs.suggestions.twinsnakes.early.content">
				Avoid refreshing <ActionLink {...ACTIONS.TWIN_SNAKES} /> signficantly before its expiration as you're losing uses of the higher potency <ActionLink {...ACTIONS.TRUE_STRIKE} />.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
			value: this.earlyTwinSnakes,
			why: <Trans id="mnk.buffs.suggestions.twinsnakes.early.why">
				{lostTruePotency} potency lost to <Plural value={this.earlyTwinSnakes} one="# early refresh" other="# early refreshes" />.
			</Trans>,
		}))
	}

	getDebuffUptimePercent(statusId: number) {
		const statusUptime = this.enemies.getStatusUptime(statusId)
		const fightDuration = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}

	getBuffUptimePercent(statusId: number) {
		const statusUptime = this.combatants.getStatusUptime(statusId, this.parser.player.id)
		const fightUptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightUptime) * 100
	}
}
