/**
 * @author Yumiya
 */
import React, {Fragment} from 'react'
import Module from '../../core/Module'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Rule, Requirement} from '../../core/modules/Checklist'

const ISSUE = {
	DROPPED: 0,
	SHORT_TRANSITION: 1,
	LONG_TRANSITION: 2,
}

export default class DoTs extends Module {
	static handle = 'dots'
	static dependencies = [
		'checklist',
		'downtime',
		'enemies',
		'invuln',
	]

	_causticCastEvents = []
	_stormCastEvents = []
	_dotFallofEvents = []

	constructor(...args) {
		super(...args)

		const causticFilter = {
			by: 'player',
			abilityId: ACTIONS.CAUSTIC_BITE.id,
		}

		const stormFilter = {
			by: 'player',
			abilityId: ACTIONS.STORMBITE.id,
		}

		const dotFallofFilter = {
			by: 'player',
			abilityId: [STATUSES.CAUSTIC_BITE.id, STATUSES.STORMBITE.id],
		}

		this.addHook('cast', causticFilter, this._onCausticCast)
		this.addHook('cast', stormFilter, this._onStormCast)
		this.addHook('removedebuff', dotFallofFilter, this._onDotFallof)
		this.addHook('complete', this._onComplete)

	}

	_onCausticCast() {

	}

	_onStormCast() {

	}

	_onDotFallof(event) {
		this._dotFallofEvents.push(event)
	}

	_onComplete() {
		this._setIssueType(this._dotFallofEvents)
		console.log(this._dotFallofEvents)

		this.checklist.add(new Rule({
			name: 'Keep your DoTs up',
			description: <> Most of Bard's DPS comes either directly or indirectly from <ActionLink {...ACTIONS.STORMBITE}/> and <ActionLink {...ACTIONS.CAUSTIC_BITE}/>.
				Make sure you have these skills applied on the target at all times. Use <ActionLink {...ACTIONS.IRON_JAWS}/> to refresh the timer on the Damage over Time (DoT) debuff.
			</>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Fragment><StatusLink {...STATUSES.STORMBITE} /> uptime</Fragment>,
					percent: () => this._getDotUptime(STATUSES.STORMBITE),
				}),
				new Requirement({
					name: <Fragment><StatusLink {...STATUSES.CAUSTIC_BITE} /> uptime</Fragment>,
					percent: () => this._getDotUptime(STATUSES.CAUSTIC_BITE),
				}),
			],
		}))
	}

	_getDotUptime(dot) {
		const dotTime = this.enemies.getStatusUptime(dot.id)
		const uptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (dotTime / uptime) * 100
	}

	_setIssueType(events) {
		for (let i = 0; i < events.length; i++) {
			if (!this.downtime.isDowntime(events[i].timestamp)) {
				events[i].issue = ISSUE.DROPPED
			} else if (this._getDowntimeLength(events[i].timestamp) <= 30 - 3) {
				events[i].issue = ISSUE.SHORT_TRANSITION
			} else {
				events[i].issue = ISSUE.LONG_TRANSITION
			}
		}
	}

	_getDowntimeLength(timestamp) {
		const window = this.downtime.getDowntimeWindows().filter(x => x.start <= timestamp && x.end >= timestamp)
		return Math.max(0, (window.end - window.start) / 1000)
	}
}

