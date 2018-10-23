import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Requirement, Rule} from 'parser/core/modules/Checklist'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'

const STATUS_DURATION = {
	[STATUSES.GORING_BLADE.id]: 21000,
}

export default class Goring extends Module {
	static handle = 'goring'
	static dependencies = [
		'checklist',
		'enemies',
		'invuln',
		'suggestions',
	]

	_lastApplication = {}
	_clip = {
		[STATUSES.GORING_BLADE.id]: 0,
	}
	_lastRequiescatHolySpirit = null
	_gcdsSinceLastReqHS = 0
	_requiescatWindow = false

	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.REQUIESCAT.id}, this._onRequiescatRemove)
		this.addHook(['applydebuff', 'refreshdebuff'], {
			by: 'player',
			abilityId: [STATUSES.GORING_BLADE.id],
		}, this._onDotApply)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const actionId = event.ability.guid

		if (actionId === ACTIONS.REQUIESCAT.id) {
			this._requiescatWindow = true
			return
		}

		if (actionId === ACTIONS.HOLY_SPIRIT.id && this._requiescatWindow) {
			this._lastRequiescatHolySpirit = event.timestamp
			this._gcdsSinceLastReqHS = 0
			return
		}

		if (!this._requiescatWindow) {
			const action = getAction(actionId)
			if (action.onGcd) {
				this._gcdsSinceLastReqHS++
			}
		}
	}

	_onRequiescatRemove() {
		this._requiescatWindow = false
	}

	_onDotApply(event) {
		const statusId = event.ability.guid

		// Make sure we're tracking for this target
		const applicationKey = `${event.targetID}|${event.targetInstance}`
		const lastApplication = this._lastApplication[applicationKey] = this._lastApplication[applicationKey] || {}

		// If it's not been applied yet, set it and skip out
		if (!lastApplication[statusId]) {
			lastApplication[statusId] = event.timestamp
			return
		}

		// Base clip calc
		let clip = STATUS_DURATION[statusId] - (event.timestamp - lastApplication[statusId])

		clip -= this.invuln.getUntargetableUptime('all', event.timestamp - STATUS_DURATION[statusId], event.timestamp)
		clip -= this.invuln.getInvulnerableUptime('all', event.timestamp, event.timestamp + STATUS_DURATION[statusId] + clip)

		// If we just came out of Requiescat rotation, allow leeway for 1 GCD
		if (this._gcdsSinceLastReqHS === 3) {
			clip -= 2500
		}

		this._clip[statusId] += Math.max(0, clip)

		lastApplication[statusId] = event.timestamp
	}

	_onComplete() {
		// Checklist rule for Goring Blade DoT uptime
		this.checklist.add(new Rule({
			name: 'Keep your Goring Blade up',
			description: <Fragment>
				As a Paladin, <ActionLink {...ACTIONS.GORING_BLADE} /> is a significant portion of your sustained
				damage, and is required to kept up for as much as possible, for the best damage output.
			</Fragment>,
			target: 90,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.GORING_BLADE} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.GORING_BLADE.id),
				}),
			],
		}))

		// Suggestion for Goring Blade DoT clipping
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.GORING_BLADE.icon,
			content: <Fragment>
				Avoid refreshing <ActionLink {...ACTIONS.GORING_BLADE} /> significantly before it's expiration.
			</Fragment>,
			why: <Fragment>
				{this.parser.formatDuration(this._clip[STATUSES.GORING_BLADE.id])} of {STATUSES.GORING_BLADE.name} lost
				to early refreshes.
			</Fragment>,
			tiers: {
				3000: SEVERITY.MINOR,
				9000: SEVERITY.MEDIUM,
				30000: SEVERITY.MAJOR,
			},
			value: this._clip[STATUSES.GORING_BLADE.id],
		}))
	}

	getDotUptimePercent(statusId) {
		const statusUptime = this.enemies.getStatusUptime(statusId)
		const fightDuration = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}
}
