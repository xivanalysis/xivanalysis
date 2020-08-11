import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredRule, TARGET, Requirement} from 'parser/core/modules/Checklist'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Trans} from '@lingui/react'

const STATUS_DURATION = 30000

const RULE_TIERS = {
	90: TARGET.WARN,
	95: TARGET.SUCCESS,
}

const SUGGESTION_TIERS = {
	500: SEVERITY.MINOR,
	9000: SEVERITY.MEDIUM,
	30000: SEVERITY.MAJOR,
}

const DOT_CLIPPING_THRESHOLD = 500 // ms of dot clipping to warrant a suggestion

export default class DoTs extends Module {
	static handle = 'dots'
	static dependencies = [
		'checklist',
		'enemies',
		'entityStatuses',
		'invuln',
		'suggestions',
	]

	_lastApplication = {}
	_clip = 0

	constructor(...args) {
		super(...args)

		const filter = {
			by: 'player',
			abilityId: [STATUSES.DIA.id],
		}
		this.addEventHook(['applydebuff', 'refreshdebuff'], filter, this._onDotApply)
		this.addEventHook('complete', this._onComplete)
	}

	_onDotApply(event) {
		// Make sure we're tracking for this target
		const applicationKey = `${event.targetID}|${event.targetInstance}`
		const lastApplication = this._lastApplication[applicationKey] || 0

		// If it's not been applied yet, or we're rushing, set it and skip out
		if (!lastApplication) {
			this._lastApplication[applicationKey] = event.timestamp
			return
		}

		// Base clip calc
		let clip = STATUS_DURATION - (event.timestamp - lastApplication)

		// Also remove invuln time in the future that casting later would just push dots into
		// TODO: This relies on a full set of invuln data ahead of time. Can this be trusted?
		clip -= this.invuln.getInvulnerableUptime('all', event.timestamp, event.timestamp + STATUS_DURATION + clip)

		// Capping clip at 0 - less than that is downtime, which is handled by the checklist requirement
		this._clip += Math.max(0, clip)

		this._lastApplication[applicationKey] = event.timestamp
	}

	_onComplete() {
		// Checklist rule for dot uptime
		this.checklist.add(new TieredRule({
			name: <Trans id="whm.dots.rule.name"> Keep your DoTs up </Trans>,
			description: <Trans id="whm.dots.rule.description">
				As a White Mage, Dia is significant portion of your sustained damage. Aim to keep them it up at all times.
			</Trans>,
			tiers: RULE_TIERS,
			requirements: [
				new Requirement({
					name: <Trans id="whm.dots.requirement.uptime-dia.name"><ActionLink {...ACTIONS.DIA} /> uptime</Trans>,
					percent: () => this.getDotUptimePercent(STATUSES.DIA.id),
				}),
			],
		}))

		//Suggestion for DoT clipping
		if (this._clip > DOT_CLIPPING_THRESHOLD) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.DIA.icon,
				content: <Trans id="whm.dots.suggestion.clip-dia.content">
					Avoid refreshing Dia significantly before its expiration, this will allow you to cast more Glares.
				</Trans>,
				tiers: SUGGESTION_TIERS,
				value: this._clip,
				why: <Trans id="whm.dots.suggestion.clip-dia.why">
					{this.parser.formatDuration(this._clip)} of {STATUSES.DIA.name} lost to early refreshes.
				</Trans>,
			}))
		}
	}

	getDotUptimePercent(statusId) {
		const statusUptime = this.entityStatuses.getStatusUptime(statusId, this.enemies.getEntities())
		const fightDuration = this.parser.currentDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}
}
