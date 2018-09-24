import {Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// Can never be too careful :blobsweat:
const STATUS_DURATION = {
	[STATUSES.BIO_III.id]: 30000,
	[STATUSES.MIASMA_III.id]: 30000,
}

const SHADOW_FLARE_DURATION = 15000

// In ms
const CLIPPING_SEVERITY = {
	1000: SEVERITY.MINOR,
	10000: SEVERITY.MEDIUM,
	30000: SEVERITY.MAJOR,
}

export default class DoTs extends Module {
	static handle = 'dots'
	static dependencies = [
		'checklist',
		'combatants',
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
		const applicationKey = `${event.targetID}|${event.targetInstance}`
		const lastApplication = this._lastApplication[applicationKey] = this._lastApplication[applicationKey] || {}

		// If it's not been applied yet, or we're rushing, set it and skip out
		if (!lastApplication[statusId] || this.gauge.isRushing()) {
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
			name: <Trans id="smn.dots.checklist.name">Keep your DoTs up</Trans>,
			description: <Trans id="smn.dots.checklist.description">
				As a Summoner, DoTs are significant portion of your sustained damage, and are required for optimal damage from <ActionLink {...ACTIONS.FESTER} />, your primary stack spender. Aim to keep them up at all times.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="smn.dots.checklist.requirement.bio-iii.name">
						<ActionLink {...ACTIONS.BIO_III} /> uptime
					</Trans>,
					percent: () => this.getDotUptimePercent(STATUSES.BIO_III.id),
				}),
				new Requirement({
					name: <Trans id="smn.dots.checklist.requirement.miasma-iii.name">
						<ActionLink {...ACTIONS.MIASMA_III} /> uptime
					</Trans>,
					percent: () => this.getDotUptimePercent(STATUSES.MIASMA_III.id),
				}),
				new Requirement({
					name: <Trans id="smn.dots.checklist.requirement.shadow-flare.name">
						<ActionLink {...ACTIONS.SHADOW_FLARE}/> uptime
					</Trans>,
					percent: () => this.getShadowFlareUptimePercent(),
				}),
			],
		}))

		// Suggestion for DoT clipping
		const maxClip = Math.max(...Object.values(this._clip))
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.TRI_DISASTER.icon,
			content: <Trans id="smn.dots.suggestions.clipping.content">
				Avoid refreshing DoTs significantly before their expiration, except when rushing during your opener or the end of the fight. Unnecessary refreshes risk overwriting buff snapshots, and increase the frequency you'll need to hardcast your DoTs.
			</Trans>,
			why: <Trans id="smn.dots.suggestions.clipping.why">
				{this.parser.formatDuration(this._clip[STATUSES.BIO_III.id])} of {STATUSES[STATUSES.BIO_III.id].name} and {this.parser.formatDuration(this._clip[STATUSES.MIASMA_III.id])} of {STATUSES[STATUSES.MIASMA_III.id].name} lost to early refreshes.
			</Trans>,
			tiers: CLIPPING_SEVERITY,
			value: maxClip,
		}))
	}

	getDotUptimePercent(statusId) {
		const statusUptime = this.enemies.getStatusUptime(statusId)
		const fightDuration = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}

	getShadowFlareUptimePercent() {
		const fightDuration = this.parser.fightDuration - this.invuln.getInvulnerableUptime()
		// Calc the total number of SF casts you coulda got off (minus the last 'cus floor)
		const maxFullCasts = Math.floor(fightDuration / (ACTIONS.SHADOW_FLARE.cooldown * 1000))

		// Calc the possible time for the last one
		const lastCastMaxDuration = Math.min(
			SHADOW_FLARE_DURATION,
			fightDuration - (maxFullCasts * ACTIONS.SHADOW_FLARE.cooldown)
		)

		const maxTotalDuration = (maxFullCasts * SHADOW_FLARE_DURATION) + lastCastMaxDuration

		// Get as %. Capping to 100%.
		return Math.min(100, (this.combatants.getStatusUptime(STATUSES.SHADOW_FLARE.id) / maxTotalDuration) * 100)
	}
}
