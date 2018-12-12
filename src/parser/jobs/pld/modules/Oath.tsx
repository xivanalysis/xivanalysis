import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, DamageEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Downtime from 'parser/core/modules/Downtime'
import React from 'react'

interface FightWindow {
	start: number
	end: number
}

export default class Oath extends Module {
	static handle = 'oath'

	@dependency downtime!: Downtime
	@dependency checklist!: Checklist

	_lastSwordOathApplication: number | null = null

	_swordOathWindows: FightWindow[] = []
	_prefightSwordOathHook!: any

	protected init() {
		this._prefightSwordOathHook = this.addHook<DamageEvent>('damage', {by: 'player', abilityId: ACTIONS.SWORD_OATH.id}, this._onSwordOathDamage)
		this.addHook<BuffEvent>('applybuff', {by: 'player', abilityId: [STATUSES.SWORD_OATH.id]}, this._onApplySwordOath)
		this.addHook<BuffEvent>('removebuff', {by: 'player', abilityId: [STATUSES.SWORD_OATH.id]}, this._onRemoveSwordOath)
		this.addHook('complete', this._onComplete)
	}

	_onSwordOathDamage() {
		if (this._lastSwordOathApplication == null) {
			// First hit, but no buff applied yet, so it was up before the fight
			this._applySwordOath(this.parser.fight.start_time)
		}
		// Only run this once, we only want to know the first instance, in case Sword Oath was on before the fight.
		this.removeHook(this._prefightSwordOathHook)
	}

	_onApplySwordOath(event: BuffEvent) {
		this._applySwordOath(event.timestamp)
	}

	_onRemoveSwordOath(event: BuffEvent) {
		this._removeSwordOath(event.timestamp)
	}

	_applySwordOath(timestamp: number) {
		if (this._lastSwordOathApplication == null) {
			this._lastSwordOathApplication = timestamp
		}
	}

	_removeSwordOath(timestamp: number) {
		if (this._lastSwordOathApplication != null) {
			this._swordOathWindows = [
				...this._swordOathWindows,
				{
					start: this._lastSwordOathApplication,
					end: timestamp,
				},
			]

			this._lastSwordOathApplication = null
		}
	}

	_swordOathUptime() {
		return this._swordOathWindows.reduce((sum, window) => sum + (window.end - window.start), 0)
	}

	_swordOathUptimePercent() {
		// Consider downtime switches, it's ok to Shield Oath, when you can't even do any damage
		const fightDuration = this.parser.fightDuration - this.downtime.getDowntime()

		// Cap this at 100
		return Math.min(this._swordOathUptime() / fightDuration * 100, 100)
	}

	_onComplete() {
		// Make sure we push the last uptime into our list
		this._removeSwordOath(this.parser.currentTimestamp)

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
					percent: () => this._swordOathUptimePercent(),
				}),
			],
		}))
	}
}
