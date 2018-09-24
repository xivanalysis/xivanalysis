import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredRule, TARGET, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Trans} from '@lingui/react'

//powerful copy paste code from SMN that ended up being changed quite a bit

const STATUS_DURATION = {
	[STATUSES.AERO_II.id]: 18000,
	[STATUSES.AERO_III.id]: 24000,
}

//aero 2 clips are less severe as it may be used for the initial damage when moving

const CLIP_MAX_MINOR = {
	[STATUSES.AERO_II.id]: 30000,
	[STATUSES.AERO_III.id]: 9000, //less than 3 gcds wasted
}
const CLIP_MAX_MEDIUM = {
	[STATUSES.AERO_II.id]: 60000,
	[STATUSES.AERO_III.id]: 24000,
}

const DOT_CLIPPING_THRESHOLD = 500 // ms of dot clipping to warrant a suggestion

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
		const applicationKey = `${event.targetID}|${event.targetInstance}`
		const lastApplication = this._lastApplication[applicationKey] = this._lastApplication[applicationKey] || {}

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
		this.checklist.add(new TieredRule({
			name: <Trans id="whm.dots.rule.name"> Keep your DoTs up </Trans>,
			description: <Trans id="whm.dots.rule.description">
				As a White Mage, DoTs are significant portion of your sustained damage. Aim to keep them up at all times.
			</Trans>,
			tiers: {90: TARGET.WARN, 95: TARGET.SUCCESS},
			requirements: [
				new Requirement({
					name: <Trans id="whm.dots.requirement.uptime-a2.name"><ActionLink {...ACTIONS.AERO_II} /> uptime</Trans>,
					percent: () => this.getDotUptimePercent(STATUSES.AERO_II.id),
				}),
				new Requirement({
					name: <Trans id="whm.dots.requirement.uptime-a3.name"><ActionLink {...ACTIONS.AERO_III} /> uptime</Trans>,
					percent: () => this.getDotUptimePercent(STATUSES.AERO_III.id),
				}),
			],
		}))

		//Suggestion for DoT clipping
		if (this._clip[STATUSES.AERO_II.id] > DOT_CLIPPING_THRESHOLD) {
			const isMinor = this._clip[STATUSES.AERO_II.id] <= CLIP_MAX_MINOR[STATUSES.AERO_II.id]
			const isMedium = this._clip[STATUSES.AERO_II.id] <= CLIP_MAX_MEDIUM[STATUSES.AERO_II.id]
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.AERO_II.icon,
				content: <Trans id="whm.dots.suggestion.clip-a2.content">
					Avoid refreshing DoTs significantly before their expiration, this will allow you to cast more Stone IV. (Note: We do not yet consider using Aero II for initial damage on the move)
				</Trans>,
				severity: isMinor ? SEVERITY.MINOR : isMedium ? SEVERITY.MEDIUM : SEVERITY.MAJOR,
				why: <Trans id="whm.dots.suggestion.clip-a2.why">
					{this.parser.formatDuration(this._clip[STATUSES.AERO_II.id])} of {STATUSES[STATUSES.AERO_II.id].name} lost to early refreshes.
				</Trans>,
			}))
		}
		if (this._clip[STATUSES.AERO_III.id] > DOT_CLIPPING_THRESHOLD) {
			const isMinor = this._clip[STATUSES.AERO_III.id] <= CLIP_MAX_MINOR[STATUSES.AERO_III.id]
			const isMedium = this._clip[STATUSES.AERO_III.id] <= CLIP_MAX_MEDIUM[STATUSES.AERO_III.id]
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.AERO_III.icon,
				content: <Trans id="whm.dots.suggestion.clip-a3.content">
					Avoid refreshing DoTs significantly before their expiration, this will allow you to cast more Stone IV.
				</Trans>,
				severity: isMinor ? SEVERITY.MINOR : isMedium ? SEVERITY.MEDIUM : SEVERITY.MAJOR,
				why: <Trans id="whm.dots.suggestion.clip-a3.why">
					{this.parser.formatDuration(this._clip[STATUSES.AERO_III.id])} of {STATUSES[STATUSES.AERO_III.id].name} lost to early refreshes.
				</Trans>,
			}))
		}
	}

	getDotUptimePercent(statusId) {
		const statusUptime = this.enemies.getStatusUptime(statusId)
		const fightDuration = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}
}
