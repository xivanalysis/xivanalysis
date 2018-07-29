import React, {Fragment} from 'react'
//import {Icon, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const SF_DURATION_MILLIS = STATUSES.SHADOW_FANG.duration * 1000

export default class ShadowFang extends Module {
	static handle = 'shadowFang'
	static dependencies = [
		'checklist',
		'combatants',
		'enemies',
		'invuln',
		'suggestions',
	]

	_lastApplication = {}
	_sfClip = 0

	constructor(...args) {
		super(...args)
		const filter = {
			by: 'player',
			abilityId: [STATUSES.SHADOW_FANG.id],
		}
		this.addHook(['applydebuff', 'refreshdebuff'], filter, this._onDotApply)
		this.addHook('complete', this._onComplete)
	}

	_onDotApply(event) {
		// Make sure we're tracking for this target
		const lastApplication = this._lastApplication[event.targetID] = this._lastApplication[event.targetID] || 0

		if (!lastApplication) {
			this._lastApplication[event.targetID] = event.timestamp
			return
		}

		// Base clip calc
		let clip = SF_DURATION_MILLIS - (event.timestamp - lastApplication)

		// Remove any untargetable time from the clip
		clip -= this.invuln.getUntargetableUptime('all', event.timestamp - SF_DURATION_MILLIS, event.timestamp)

		// Also remove invuln time in the future that casting later would just push dots into
		// TODO: This relies on a full set of invuln data ahead of time. Can this be trusted?
		clip -= this.invuln.getInvulnerableUptime('all', event.timestamp, event.timestamp + SF_DURATION_MILLIS + clip)

		// Capping clip at 0 - less than that is downtime, which is handled by the checklist requirement
		this._sfClip += Math.max(0, clip)

		this._lastApplication[event.targetID] = event.timestamp
	}

	_onComplete() {
		// Checklist rule for dot uptime
		this.checklist.add(new Rule({
			name: 'Keep Shadow Fang up',
			description: <Fragment>
				As a NIN, <ActionLink {...ACTIONS.SHADOW_FANG}/> is your strongest combo finisher (assuming at least 4 DoT ticks hit). In addition, it provides a slashing debuff which you, WARs, and SAMs are responsible for maintaining and should ideally never let lapse.
			</Fragment>,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.SHADOW_FANG}/> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(),
				}),
			],
		}))

		// Suggestion for DoT clipping
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SHADOW_FANG.icon,
			content: <Fragment>
				Avoid refreshing <ActionLink {...ACTIONS.SHADOW_FANG}/> significantly before its expiration, unless it would otherwise cost you significant uptime. Unnecessary refreshes risk overwriting buff snapshots and reduce the number of times you can use <ActionLink {...ACTIONS.AEOLIAN_EDGE}/>.
			</Fragment>,
			tiers: {
				7: SEVERITY.MINOR,
				10: SEVERITY.MEDIUM,
				15: SEVERITY.MAJOR,
			},
			value: this.getDotClippingAmount(),
			why: <Fragment>
				You lost {this.parser.formatDuration(this._sfClip)} of Shadow Fang to early refreshes.
			</Fragment>,
		}))
	}

	getDotUptimePercent() {
		const statusUptime = this.enemies.getStatusUptime(STATUSES.SHADOW_FANG.id)
		const fightDuration = this.parser.fightDuration - this.invuln.getInvulnerableUptime()
		return (statusUptime / fightDuration) * 100
	}

	getDotClippingAmount() {
		// Simplified math, bitches
		const fightDurationMillis = (this.parser.fightDuration - this.invuln.getInvulnerableUptime())
		const clipSecsPerMin = Math.round((this._sfClip * 60) / fightDurationMillis)
		return clipSecsPerMin
	}
}
