import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Requirement, Rule} from 'parser/core/modules/Checklist'
import React, {Fragment} from 'react'

export default class Oath extends Module {
	static handle = 'oath'
	static dependencies = [
		'downtime',
		'checklist',
	]

	_lastSwordOathApplication = null

	_swordOathWindows = []

	constructor(...args) {
		super(...args)
		this._prefightSwordOathHook = this.addHook('damage', {by: 'player', abilityId: ACTIONS.SWORD_OATH.id}, this._onSwordOathDamage)
		this.addHook('applybuff', {by: 'player', abilityId: [STATUSES.SWORD_OATH.id]}, this._onApplySwordOath)
		this.addHook('removebuff', {by: 'player', abilityId: [STATUSES.SWORD_OATH.id]}, this._onRemoveSwordOath)
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

	_onApplySwordOath(event) {
		this._applySwordOath(event.timestamp)
	}

	_onRemoveSwordOath(event) {
		this._removeSwordOath(event.timestamp)
	}

	_applySwordOath(timestamp) {
		if (this._lastSwordOathApplication == null) {
			this._lastSwordOathApplication = timestamp
		}
	}

	_removeSwordOath(timestamp) {
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
			description: <Fragment>
				As a Paladin, <ActionLink {...ACTIONS.SWORD_OATH} /> is a decent chunk of your sustained
				damage, and should be used as much as possible, for the best damage output.
			</Fragment>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.SWORD_OATH} /> uptime</Fragment>,
					percent: () => this._swordOathUptimePercent(),
				}),
			],
		}))
	}
}
