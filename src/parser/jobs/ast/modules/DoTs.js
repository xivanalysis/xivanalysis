import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Trans} from '@lingui/react'

// Can never be too careful :blobsweat:
const STATUS_DURATION = {
	[STATUSES.COMBUST_II.id]: 30000,
}
const MINOR_CLIPPING_THRESHOLD = 10000
const MAXCLIP_THRESHOLD = 500

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
		[STATUSES.COMBUST_II.id]: 0,
	}

	constructor(...args) {
		super(...args)

		const filter = {
			by: 'player',
			abilityId: [STATUSES.COMBUST_II.id],
		}
		this.addHook(['applydebuff', 'refreshdebuff'], filter, this._onDotApply)
		this.addHook('complete', this._onComplete)
	}

	_onDotApply(event) {
		const statusId = event.ability.guid

		// Make sure we're tracking for this target
		const applicationKey = `${event.targetID}|${event.targetInstance}`
		const lastApplication = this._lastApplication[applicationKey] = this._lastApplication[applicationKey] || {}

		// If it's not been applied yet set it and skip out
		if (!lastApplication[statusId]) {
			lastApplication[statusId] = event.timestamp
			return
		}

		// Base clip calc
		let clip = STATUS_DURATION[statusId] - (event.timestamp - lastApplication[statusId])

		// Remove any untargetable time from the clip - often want to reapply after an invuln phase.
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
			name: <Trans id="ast.dots.rule.name">Keep your DoT up</Trans>,
			description: <Fragment>
				<Trans id="ast.dots.rule.description">
				While Astrologians only have one DoT, it still makes up a good portion of your damage. The duration of 30 seconds matches the cooldown on (<ActionLink {...ACTIONS.DRAW} />), giving you space to manage cards. It also enables you to maneuver around without dropping GCD uptime. Aim to keep this DoT up at all times.
				</Trans>
			</Fragment>,
			requirements: [
				new Requirement({
					name: <Fragment>
						<Trans id="ast.dots.requirement.uptime.name">
							<ActionLink {...ACTIONS.COMBUST_II} /> uptime
						</Trans>
					</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.COMBUST_II.id),
				}),
			],
		}))

		// Suggestion for DoT clipping
		const maxClip = Math.max(...Object.values(this._clip))

		if (maxClip > MAXCLIP_THRESHOLD) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.COMBUST_II.icon,
				content: <Fragment>
					<Trans id="ast.dots.suggestion.clip.content">
					Avoid refreshing <ActionLink {...ACTIONS.COMBUST_II} /> significantly before it expires.
					</Trans>
				</Fragment>,
				severity: maxClip < MINOR_CLIPPING_THRESHOLD ? SEVERITY.MINOR : maxClip < STATUS_DURATION[ACTIONS.COMBUST_II.id] ? SEVERITY.MEDIUM : SEVERITY.MAJOR,
				why: <Fragment>
					<Trans id="ast.dots.suggestion.clip.why">
						{this.parser.formatDuration(this._clip[STATUSES.COMBUST_II.id])} of {STATUSES[STATUSES.COMBUST_II.id].name} lost to early refreshes.
					</Trans>
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
