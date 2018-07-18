import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// Can never be too careful :blobsweat:
const STATUS_DURATION = {
	[STATUSES.BIO_III.id]: 30000,
	[STATUSES.MIASMA_III.id]: 30000,
}

export default class DoTs extends Module {
	static handle = 'dots'
	static dependencies = [
		'checklist',
		'cooldowns',
		'enemies',
		'gauge',
		'invuln',
		'suggestions',
	]

	_lastApplication = {}
	_clip = {
		[STATUSES.BIO_III.id]: 0,
		[STATUSES.MIASMA_III.id]: 0,
	}

	constructor(...args) {
		super(...args)

		const filter = {
			by: 'player',
			abilityId: [STATUSES.BIO_III.id, STATUSES.MIASMA_III.id],
		}
		this.addHook(['applydebuff', 'refreshdebuff'], filter, this._onDotApply)
		this.addHook('complete', this._onComplete)
	}

	_onDotApply(event) {
		const statusId = event.ability.guid

		// Make sure we're tracking for this target
		const lastApplication = this._lastApplication[event.targetID] = this._lastApplication[event.targetID] || {}

		// If it's not been applied yet, or we're rushing, set it and skip out
		if (!lastApplication[statusId] || this.gauge.isRushing()) {
			lastApplication[statusId] = event.timestamp
			return
		}

		const sinceApplication = event.timestamp - lastApplication[statusId]

		// Capping clip at 0 - less than that is downtime, which is handled by the checklist requirement
		this._clip[statusId] += Math.max(0, STATUS_DURATION[statusId] - sinceApplication)

		lastApplication[statusId] = event.timestamp
	}

	_onComplete() {
		// Checklist rule for dot uptime
		this.checklist.add(new Rule({
			name: 'Keep your DoTs up',
			description: <Fragment>
				As a Summoner, DoTs are significant portion of your sustained damage, and are required for optimal damage from <ActionLink {...ACTIONS.FESTER} />, your primary stack spender. Aim to keep them up at all times.
			</Fragment>,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.BIO_III} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.BIO_III.id),
				}),
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.MIASMA_III} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.MIASMA_III.id),
				}),
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.SHADOW_FLARE}/> cooldown uptime</Fragment>,
					percent: () => this.getShadowFlareUptimePercent(),
				}),
			],
		}))

		// Suggestion for DoT clipping
		const maxClip = Math.max(...Object.values(this._clip))
		this.suggestions.add(new Suggestion({
			icon: ACTIONS.TRI_DISASTER.icon,
			content: <Fragment>
				Avoid refreshing DoTs significantly before their expiration, except when rushing during your opener or the end of the fight. Unnecessary refreshes risk overwriting buff snapshots, and increase the frequency you&apos;ll need to hardcast your DoTs.
			</Fragment>,
			severity: maxClip < 10000? SEVERITY.MINOR : maxClip < 30000? SEVERITY.MEDIUM : SEVERITY.MAJOR,
			why: <Fragment>
				{this.parser.formatDuration(this._clip[STATUSES.BIO_III.id])} of {STATUSES[STATUSES.BIO_III.id].name} and {this.parser.formatDuration(this._clip[STATUSES.MIASMA_III.id])} of {STATUSES[STATUSES.MIASMA_III.id].name} lost to early refreshes.
			</Fragment>,
		}))
	}

	getDotUptimePercent(statusId) {
		const statusUptime = this.enemies.getStatusUptime(statusId)
		let fightDuration = this.parser.fightDuration

		fightDuration -= this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}

	getShadowFlareUptimePercent() {
		// Need to do this manually, as I want to remove boss invuln periods from the total
		const cdHistory = this.cooldowns.getCooldown(ACTIONS.SHADOW_FLARE.id).history
		const uptime = cdHistory.reduce((carry, cd) => {
			// Removing invuln time from the CD, we're not really counting it
			const invulnTime = this.invuln.getInvulnerableUptime('all', cd.timestamp, cd.timestamp + cd.length)
			return carry + cd.length - invulnTime
		}, 0)

		const duration = this.parser.fightDuration - this.invuln.getInvulnerableUptime()
		return (uptime / duration) * 100
	}
}
