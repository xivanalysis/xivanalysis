import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const STATUS_DURATION = {
	[STATUSES.CAUSTIC_BITE.id]: 30000,
	[STATUSES.STORMBITE.id]: 30000,
}

export default class DoTs extends Module {
	static handle = 'dots'
	static dependencies = [
		'checklist',
		'enemies',
		'invuln',
		'suggestions',
	]

	_lastApplication = {}
	_clip = {
		[STATUSES.CAUSTIC_BITE.id]: 0,
		[STATUSES.STORMBITE.id]: 0,
	}

	constructor(...args) {
		super(...args)

		const filter = {
			by: 'player',
			abilityId: [STATUSES.CAUSTIC_BITE.id, STATUSES.STORMBITE.id],
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
			name: 'Keep your DoTs up',
			description: <Fragment>
				Brd + Dots = <img src="https://i.imgur.com/YzbDyRg.png" alt="blobmorning" height="27" width="32"></img>
			</Fragment>,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.CAUSTIC_BITE} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.CAUSTIC_BITE.id),
				}),
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.STORMBITE} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.STORMBITE.id),
				}),
			],
		}))

		// Suggestion for DoT clipping
		const maxClip = Math.max(...Object.values(this._clip))
		this.suggestions.add(new Suggestion({
			icon: ACTIONS.IRON_JAWS.icon,
			content: <Fragment>
				Avoid refreshing DoTs significantly before their expiration, except when rushing during your opener or the end of the fight. Unnecessary refreshes risk overwriting buff snapshots, and increase the frequency you&apos;ll need to hardcast your DoTs.
			</Fragment>,
			severity: maxClip < 10000? SEVERITY.MINOR : maxClip < 30000? SEVERITY.MEDIUM : SEVERITY.MAJOR,
			why: <Fragment>
				{this.parser.formatDuration(this._clip[STATUSES.CAUSTIC_BITE.id])} of {STATUSES[STATUSES.CAUSTIC_BITE.id].name} and {this.parser.formatDuration(this._clip[STATUSES.STORMBITE.id])} of {STATUSES[STATUSES.STORMBITE.id].name} lost to early refreshes.
			</Fragment>,
		}))
	}

	getDotUptimePercent(statusId) {
		const statusUptime = this.enemies.getStatusUptime(statusId)
		let fightDuration = this.parser.fightDuration

		fightDuration -= this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}
}
