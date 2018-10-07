import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
//import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const STATUS_DURATION = {
	[STATUSES.HIGANBANA.id]: 60000,
}

const CLIPPING_SEVERITY = {
	1000: SEVERITY.MINOR,
	30000: SEVERITY.MEDIUM,
	60000: SEVERITY.MAJOR,
}
export default class Higanbana extends Module {
	static handle = 'higanbana'
	static dependencies = [
		'checklist',
		'enemies',
		'invuln',
		'suggestions',
	]

	_lastApplication = {}
	_clip = {
		[STATUSES.HIGANBANA.id]: 0,
	}

	constructor(...args) {
		super(...args)

		const filter = {
			by: 'player',

			abilityId: [STATUSES.HIGANBANA.id],
		}
		this.addHook(['applydebuff', 'refreshdebuff'], filter, this._onDotApply)
		this.addHook('complete', this._onComplete)
	}

	_onDotApply(event) {
		const statusId = event.ability.guid

		// Make sure we're tracking for this target
		const applicationKey = `${event.targetID}|${event.targetInstance}`
		const lastApplication = this._lastApplication[applicationKey] = this._lastApplication[applicationKey] || {}

		// If it's not been applied yet, or we're rushing, set it and skip out
		if (!lastApplication[statusId]) {
			lastApplication[statusId] = event.timestamp
			return
		}

		// Base clip calc
		let clip = STATUS_DURATION[statusId] - (event.timestamp - lastApplication[statusId])

		// Remove any untargetable time from the clip - often want to hardcast after an invuln phase, but refresh w/ 3D shortly after.
		clip -= this.invuln.getUntargetableUptime('all', event.timestamp - STATUS_DURATION[statusId], event.timestamp)

		// Also remove invuln time in the future that casting later would just push dots into
		// TODO: This relies on a full set of invuln data ahead of time. Can this be trusted?
		clip -= this.invuln.getInvulnerableUptime('all', event.timestamp, event.timestamp + STATUS_DURATION[statusId] + clip)

		// Capping clip at 0 - less than that is downtime, which is handled by the checklist requirement
		this._clip[statusId] += Math.max(0, clip)

		lastApplication[statusId] = event.timestamp
	}

	_onComplete() {
		// Checklist rule for dot uptime
		this.checklist.add(new Rule({
			name: 'Keep Higanbana up',
			description: <Fragment>
			As a Samurai, <ActionLink {...ACTIONS.HIGANBANA} /> is a significant portion of your sustained damage, and is required to kept up for as much as possible, for the best damage output.
			</Fragment>,
			target: 90,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.HIGANBANA} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.HIGANBANA.id),
				}),
			],
		}))

		// Suggestion for DoT clipping
		const maxClip = Math.max(...Object.values(this._clip))
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HIGANBANA.icon,
			content: <Fragment>
				Avoid refreshing <ActionLink {...ACTIONS.HIGANBANA} /> significantly before it expires.
			</Fragment>,
			why: <Fragment>
				{this.parser.formatDuration(this._clip[STATUSES.HIGANBANA.id])} of {STATUSES[STATUSES.HIGANBANA.id].name} lost to early refreshes.
			</Fragment>,
			tiers: CLIPPING_SEVERITY,
			value: maxClip,
		}))
	}
	getDotUptimePercent(statusId) {
		const statusUptime = this.enemies.getStatusUptime(statusId)
		const fightDuration = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}
}
