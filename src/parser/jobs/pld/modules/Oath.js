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

	firstSwordOathAttackFound = false
	lastSwordOathApplication = null

	swordOathWindows = []

	constructor(...args) {
		super(...args)
		this.addHook('damage', {by: 'player', abilityId: ACTIONS.SWORD_OATH.id}, this._onSwordOathDamage)
		this.addHook('applybuff', {
			by: 'player',
			abilityId: [STATUSES.SWORD_OATH.id],
		}, this._onApplySwordOath)
		this.addHook('removebuff', {
			by: 'player',
			abilityId: [STATUSES.SWORD_OATH.id],
		}, this._onRemoveSwordOath)
		this.addHook('complete', this._onComplete)
	}

	_onSwordOathDamage() {
		if (!this.firstSwordOathAttackFound) {
			if (this.lastSwordOathApplication == null) {
				// First hit, but no buff applied yet, so it was up before the fight
				this.applySwordOath(this.parser.fight.start_time)
			}
			this.firstSwordOathAttackFound = true
		}
	}

	_onApplySwordOath(event) {
		this.applySwordOath(event.timestamp)
	}

	_onRemoveSwordOath(event) {
		this.removeSwordOath(event.timestamp)
	}

	applySwordOath(timestamp) {
		if (this.lastSwordOathApplication == null) {
			this.lastSwordOathApplication = timestamp
		}
	}

	removeSwordOath(timestamp) {
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

	swordOathUptime() {
		return this.swordOathWindows.reduce((sum, window) => sum + (window.end - window.start), 0)
	}

	swordOathUptimePercent() {
		// Consider downtime switches, it's ok to Shield Oath, when you can't even do any damage
		const fightDuration = this.parser.fightDuration - this.downtime.getDowntime()

		// Cap this at 100
		return Math.min(this.swordOathUptime() / fightDuration * 100, 100)
	}

	_onComplete() {
		// Make sure we push the last uptime into our list
		this.removeSwordOath(this.parser.currentTimestamp)

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
					percent: () => this.swordOathUptimePercent(),
				}),
			],
		}))
	}
}
