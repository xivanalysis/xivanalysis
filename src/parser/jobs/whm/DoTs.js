import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

//powerful copy paste code from SMN

const STATUS_DURATION = {
	[STATUSES.AERO_II.id]: 18000,
	[STATUSES.AERO_III.id]: 24000,
}

export default class DoTs extends Module {
    static handle = 'dots'
	static dependencies = [
		'checklist',
		'combatants',
		'cooldowns',
		'enemies',
		'invuln',
		'suggestions',
	]

    _lastApplication = {}
	_clip = {
		[STATUSES.AERO_II.id]: 0,
		[STATUSES.AERO_III.id]: 0,
	}

	constructor(...args) {
		super(...args)

		const filter = {
			by: 'player',
			abilityId: [STATUSES.AERO_II.id, STATUSES.AERO_III.id],
		}
		this.addHook(['applydebuff', 'refreshdebuff'], filter, this._onDotApply)
		this.addHook('complete', this._onComplete)
	}

	_onDotApply(event) {
		const statusId = event.ability.guid

		// Make sure we're tracking for this target
		const lastApplication = this._lastApplication[event.targetID] = this._lastApplication[event.targetID] || {}

		// If it's not been applied yet, or we're rushing, set it and skip out
		if (!lastApplication[statusId]) {
			lastApplication[statusId] = event.timestamp
			return
		}

		// Base clip calc
		let clip = STATUS_DURATION[statusId] - (event.timestamp - lastApplication[statusId])

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
			name: 'Keep your DoTs up',
			description: <Fragment>
				As a White Mage, DoTs are significant portion of your sustained damage. Aim to keep them up at all times.
			</Fragment>,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.AERO_II} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.AERO_II.id),
				}),
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.AERO_III} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.AERO_III.id),
				}),
			],
		}))

		// Suggestion for DoT clipping
		const maxClip = Math.max(...Object.values(this._clip))
		if(maxClip > 500)
		{
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.AERO_II.icon,
				content: <Fragment>
					Avoid refreshing DoTs significantly before their expiration, this results in losing damage from Stone IV casts.
				</Fragment>,
				severity: maxClip < 10000? SEVERITY.MINOR : maxClip < 30000? SEVERITY.MEDIUM : SEVERITY.MAJOR,
				why: <Fragment>
					{this.parser.formatDuration(this._clip[STATUSES.AERO_II.id])} of {STATUSES[STATUSES.AERO_II.id].name} and {this.parser.formatDuration(this._clip[STATUSES.AERO_III.id])} of {STATUSES[STATUSES.AERO_III.id].name} lost to early refreshes.
				</Fragment>,
			}))
		}
	}

	getDotUptimePercent(statusId) {
		const statusUptime = this.enemies.getStatusUptime(statusId)
		const fightDuration = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}

}
