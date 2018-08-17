import React, {Fragment} from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const DEMO_DURATION_MILLIS = STATUSES.DEMOLISH.duration * 1000

export default class Demolish extends Module {
	static handle = 'demolish'
	static dependencies = [
		'checklist',
		'enemies',
		'invuln',
		'suggestions',
	]

	_clipDemo = 0
	_lastDemo = {}

	constructor(...args) {
		super(...args)

		const filter = {
			by: 'player',
			abilityId: STATUSES.DEMOLISH.id,
		}

		this.addHook(['applydebuff', 'refreshdebuff'], filter, this._onApply)
		this.addHook('complete', this._onComplete)
	}

	// Aggregate Demo uptime
	_onApply(event) {
		const lastDemo = this._lastDemo[event.targetID] = this._lastDemo[event.targetID] || 0

		if (!lastDemo) {
			this._lastDemo[event.targetID] = event.timestamp
			return
		}

		let clip = DEMO_DURATION_MILLIS - (event.timestamp - lastDemo)

		clip -= this.invuln.getUntargetableUptime('all', event.timestamp - DEMO_DURATION_MILLIS, event.timestamp)
		clip -= this.invuln.getInvulnerableUptime('all', event.timestamp, event.timestamp + DEMO_DURATION_MILLIS + clip)

		this._clipDemo += Math.max(0, clip)
		this._lastDemo[event.targetID] = event.timestamp
	}

	_onComplete() {
		this.checklist.add(new Rule({
			name: 'Keep Demolish up',
			description: <Fragment>
				<ActionLink {...ACTIONS.DEMOLISH}/> is your strongest finisher (assuming at least 4 DoT ticks hit).
			</Fragment>,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.DEMOLISH}/> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(),
				}),
			],
			// TODO: calculate the number of good Demolishes a fight should have
			//       and set target to allow dropping without losing a tick
			target: 85,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DEMOLISH.icon,
			content: <Fragment>
				Avoid refreshing <ActionLink {...ACTIONS.DEMOLISH}/> significantly before its expiration, unless it would result in a bad refresh due to <StatusLink {...STATUSES.GREASED_LIGHTNING_I} /> recovery. Unnecessary refreshes risk overwriting buff snapshots.
			</Fragment>,
			tiers: {
				7: SEVERITY.MINOR,
				10: SEVERITY.MEDIUM,
				12: SEVERITY.MAJOR,
			},
			value: this.getDotClippingAmount(),
			why: <Fragment>
				You lost {this.parser.formatDuration(this._clipDemo)} of Demolish to early refreshes.
			</Fragment>,
		}))
	}

	getDotUptimePercent() {
		const statusUptime = this.enemies.getStatusUptime(STATUSES.DEMOLISH.id)
		const fightDuration = this.parser.fightDuration - this.invuln.getInvulnerableUptime()
		return (statusUptime / fightDuration) * 100
	}

	getDotClippingAmount() {
		const fightDurationMillis = (this.parser.fightDuration - this.invuln.getInvulnerableUptime())
		const clipSecsPerMin = Math.round((this._clipDemo * 60) / fightDurationMillis)
		return clipSecsPerMin
	}
}
