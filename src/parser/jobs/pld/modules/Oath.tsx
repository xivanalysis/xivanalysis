import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, DamageEvent} from 'fflogs'
import Module, {dependency, Hook} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Downtime from 'parser/core/modules/Downtime'
import React from 'react'

interface FightWindow {
	start: number
	end: number
}

export default class Oath extends Module {
	static handle = 'oath'

	@dependency private downtime!: Downtime
	@dependency private checklist!: Checklist

	private lastSwordOathApplication: number | null = null

	private swordOathWindows: FightWindow[] = []
	private prefightSwordOathHook!: Hook<DamageEvent>

	protected init() {
		this.prefightSwordOathHook = this.addHook<DamageEvent>('damage', {by: 'player', abilityId: ACTIONS.SWORD_OATH.id}, this.onSwordOathDamage)
		this.addHook('applybuff', {by: 'player', abilityId: [STATUSES.SWORD_OATH.id]}, this.onApplySwordOath)
		this.addHook('removebuff', {by: 'player', abilityId: [STATUSES.SWORD_OATH.id]}, this.onRemoveSwordOath)
		this.addHook('complete', this.onComplete)
	}

	private onSwordOathDamage() {
		if (this.lastSwordOathApplication == null) {
			// First hit, but no buff applied yet, so it was up before the fight
			this.applySwordOath(this.parser.fight.start_time)
		}
		// Only run this once, we only want to know the first instance, in case Sword Oath was on before the fight.
		this.removeHook(this.prefightSwordOathHook)
	}

	private onApplySwordOath(event: BuffEvent) {
		this.applySwordOath(event.timestamp)
	}

	private onRemoveSwordOath(event: BuffEvent) {
		this.removeSwordOath(event.timestamp)
	}

	private applySwordOath(timestamp: number) {
		if (this.lastSwordOathApplication == null) {
			this.lastSwordOathApplication = timestamp
		}
	}

	private removeSwordOath(timestamp: number) {
		if (this.lastSwordOathApplication != null) {
			this.swordOathWindows = [
				...this.swordOathWindows,
				{
					start: this.lastSwordOathApplication,
					end: timestamp,
				},
			]

			this.lastSwordOathApplication = null
		}
	}

	private swordOathUptime() {
		return this.swordOathWindows.reduce((sum, window) => sum + (window.end - window.start), 0)
	}

	private swordOathUptimePercent() {
		// Consider downtime switches, it's ok to Shield Oath, when you can't even do any damage
		const fightDuration = this.parser.fightDuration - this.downtime.getDowntime()

		// Cap this at 100
		return Math.min(this.swordOathUptime() / fightDuration * 100, 100)
	}

	private onComplete() {
		// Make sure we push the last uptime into our list
		this.removeSwordOath(this.parser.currentTimestamp)

		this.checklist.add(new Rule({
			name: 'Keep in Sword Oath when possible',
			description: <Trans id="pld.oath.checklist.swordoath.description">
				As a Paladin, <ActionLink {...ACTIONS.SWORD_OATH} /> is a decent chunk of your sustained
				damage, and should be used as much as possible, for the best damage output.
			</Trans>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Trans id="pld.requiescat.checklist.swordoath.requirement.uptime"><ActionLink {...ACTIONS.SWORD_OATH} /> uptime</Trans>,
					percent: () => this.swordOathUptimePercent(),
				}),
			],
		}))
	}
}
