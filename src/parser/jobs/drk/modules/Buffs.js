import {Plural, Trans} from '@lingui/react'
import React, {Fragment} from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import Module from 'parser/core/Module'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

/* CURRENTLY UNUSED. FUTURE IMPROVEMENT
// Things that should eventually get flagged if they show up under grit and darkside
// Later on, this should be a map of potency loss and hate bonus
const OFFENSIVE_ACTIONS = [
	//gcd
	//combo
	ACTIONS.HARD_SLASH.id,
	ACTIONS.SYPHON_STRIKE.id,
	ACTIONS.SOULEATER.id,
	ACTIONS.SPINNING_SLASH.id,
	ACTIONS.POWER_SLASH.id,
	//blood
	ACTIONS.BLOODSPILLER.id,
	ACTIONS.QUIETUS.id,
	//non combo
	ACTIONS.UNLEASH.id,
	ACTIONS.UNMEND.id,
	ACTIONS.ABYSSAL_DRAIN.id,
	//ogcd
	ACTIONS.PLUNGE.id,
	ACTIONS.CARVE_AND_SPIT.id,
	ACTIONS.DARK_PASSENGER.id,
	ACTIONS.SALTED_EARTH.id,
]
*/

export default class Buffs extends Module {
	static handle = 'buffs'
	static title = 'Buffs and Stances'
	static dependencies = [
		'combatants',
		'checklist',
		'brokenLog',
		'suggestions',
	]
	// -----
	// Accessors
	// -----
	// this entire block used to have more logic to handle TBN and some weird blood weapon cases,
	// but ended up just getting simplified.  Probably will be expanded upon later.
	darkSideActive() {
		return this.combatants.selected.hasStatus(STATUSES.DARKSIDE.id)
	}
	gritActive() {
		return this.combatants.selected.hasStatus(STATUSES.GRIT.id)
	}
	bloodWeaponActive() {
		return this.combatants.selected.hasStatus(STATUSES.BLOOD_WEAPON.id)
	}
	bloodPriceActive() {
		return this.combatants.selected.hasStatus(STATUSES.BLOOD_PRICE.id)
	}
	darkArtsActive() {
		return this.combatants.selected.hasStatus(STATUSES.DARK_ARTS.id)
	}

	// -----
	// Evaluation Metrics
	// -----
	_gritWindows = []
	_darksideWindows = []
	_lastDarksideCast = null
	_wastedDelirium = 0

	_severityWastedDelirium = {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	}

	constructor(...args) {
		super(...args)
		this.addHook(['applybuff', 'removebuff'], {by: 'player', abilityId: STATUSES.GRIT.id}, this._updateGritWindow)
		this.addHook(['cast'], {by: 'player', abilityId: ACTIONS.BLOOD_PRICE.id}, this._updateGritWindow)
		this.addHook(['applybuff', 'removebuff'], {by: 'player', abilityId: STATUSES.DARKSIDE.id}, this._updateDarksideWindow)
		this.addHook(['cast'], {by: 'player', abilityId: ACTIONS.DARKSIDE.id}, this._trackDarksideCasts)
		this.addHook(['cast'], {by: 'player', abilityId: ACTIONS.DELIRIUM.id}, this._checkDeliriumCast)
		this.addHook('complete', this._onComplete)
	}

	_updateGritWindow(event) {
		if (event.type === 'applybuff') {
			if (this._gritWindows.length > 0) {
				const lastWindow = this._gritWindows[this._gritWindows.length - 1]
				if (lastWindow.end === null) {
					this.brokenLog.trigger(this, 'grit reapply', (
						<Trans id="drk.buffs.trigger.grit-reapply">
							<StatusLink {...STATUSES.GRIT}/> was applied while still active.
						</Trans>
					))
				}
			}

			this._gritWindows.push({start: event.timestamp, end: null})
		} else if (event.type === 'removebuff') {
			const currentWindow = this._gritWindows[this._gritWindows.length - 1]
			if (currentWindow.end !== null) {
				this.brokenLog.trigger(this, 'grit multiple removals', (
					<Trans id="drk.buffs.trigger.grit-multiple-removals">
						<StatusLink {...STATUSES.GRIT}/> was removed multiple times in a single window.
					</Trans>
				))
			}

			currentWindow.end = event.timestamp
		} else if (event.type === 'cast' && event.ability.guid === ACTIONS.BLOOD_PRICE.id) {
			// Blood price is cast - check to see if Grit has already been marked as active
			if (this._gritWindows.length === 0) {
				// Grit not tracked as active, normalize start time to beginning of fight
				const windowStart = this.parser.fight.start_time
				this._gritWindows.push({start: windowStart, end: null})
			}
		}
	}

	_updateDarksideWindow(event) {
		if (event.type === 'applybuff') {
			if (this._darksideWindows.length > 0) {
				const lastWindow = this._darksideWindows[this._darksideWindows.length - 1]
				if (lastWindow.end === null) {
					// Seeing two applybuff events without a removebuff in between, note log is broken and assume continuous uptime of previous Darkside buff
					//   return without adding a new buff window
					this.brokenLog.trigger(this, 'darkside reapply', (
						<Trans id="drk.buffs.trigger.darkside-reapply">
							<StatusLink {...STATUSES.DARKSIDE}/> was applied while still active.
						</Trans>
					))
					return
				}
			}

			let windowStart = event.timestamp
			if (this._lastDarksideCast === null) {
				// No cast, this is being re-applied from before fight, normalize start time to beginning of fight
				windowStart = this.parser.fight.start_time
			}
			this._darksideWindows.push({start: windowStart, end: null})
		} else if (event.type === 'removebuff') {
			const currentWindow = this._darksideWindows[this._darksideWindows.length - 1]
			if (currentWindow.end !== null) {
				this.brokenLog.trigger(this, 'darkside multiple removals', (
					<Trans id="drk.buffs.trigger.darkside-multiple-removals">
						<StatusLink {...STATUSES.DARKSIDE}/> was removed multiple times in a single window.
					</Trans>
				))
			}

			currentWindow.end = event.timestamp
		}
	}

	_trackDarksideCasts(event) {
		this._lastDarksideCast = event.timeStamp
	}

	_checkDeliriumCast() {
		if (!(this.bloodPriceActive() || this.bloodWeaponActive())) {
			this._wastedDelirium++
		}
	}

	// noinspection JSMethodCanBeStatic
	_endActiveBuffWindows(event, buffWindowArray) {
		const lastWindow = buffWindowArray[buffWindowArray.length - 1]
		if (lastWindow.end === null) {
			lastWindow.end = event.timestamp
		}
	}

	_calculateActiveTime(buffWindowArray) {
		let activeTime = 0
		buffWindowArray.forEach((buffWindow) => {
			activeTime += (buffWindow.end - buffWindow.start)
		})
		return activeTime
	}

	_onComplete(event) {
		// cleanup
		if (this._darksideWindows.length > 0) { this._endActiveBuffWindows(event, this._darksideWindows) }
		if (this._gritWindows.length > 0) { this._endActiveBuffWindows(event, this._gritWindows) }
		// -----
		// UI Component
		// -----
		// fight durations
		const rawFightDuration = this.parser.fightDuration
		//calculate actual buff durations
		const fightDarksideDuration = this._calculateActiveTime(this._darksideWindows)
		const fightDarksidePercent = Math.min(((fightDarksideDuration / rawFightDuration) * 100), 100)
		this.checklist.add(new Rule({
			name: <Fragment><ActionLink {...ACTIONS.DARKSIDE}/></Fragment>,
			description: 'Darkside should only be removed during downtime natural mana regeneration.',
			requirements: [
				new Requirement({
					name: 'Darkside Total Uptime',
					percent: fightDarksidePercent,
				}),
			],
		}))

		const fightGritDuration = this._calculateActiveTime(this._gritWindows)
		const fightNoGritPercent = Math.min((100 - ((fightGritDuration / rawFightDuration) * 100)), 100)
		this.checklist.add(new Rule({
			name: <Fragment>No <ActionLink {...ACTIONS.GRIT}/></Fragment>,
			description: <Fragment>Grit is required for enmity openers and some points of excessive damage, but drastically reduces damage output.</Fragment>,
			requirements: [
				new Requirement({
					name: 'Fight Spent without Grit',
					percent: fightNoGritPercent,
				}),
			],
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DELIRIUM.icon,
			content: <Fragment>
				You used Delirium without Blood Price or Blood Weapon active, spending blood for no effect
			</Fragment>,
			tiers: this._severityWastedDelirium,
			value: this._wastedDelirium,
			why: <Fragment>
				You cast Delirium {this._wastedDelirium} <Plural value={this._wastedDelirium} one="time" other="times" /> without extending a buff.
			</Fragment>,
		}))
	}

	output() {
		return false
	}
}
