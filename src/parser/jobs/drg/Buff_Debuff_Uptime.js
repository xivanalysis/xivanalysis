import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'


//Playing it safe always. Gotta use protection
const STATUS_DURATION = {
	[STATUSES.DISEMBOWEL.id]: 30000,
	[STATUSES.CHAOS_THRUST.id]: 30000,
	[STATUSES.HEAVY_THRUST.id]: 30000,
}


//const HEAVY_THRUST_DURATION = 30000

export default class Dots extends Module{
	static handle = 'dots'
	static dependencies=[
		'checklist',
		'combatants',
		'cooldowns',
		'enemies',
		'invuln',
		'suggestions',
	]

	_lastApplication = {}
	_clip = {
		[STATUSES.DISEMBOWEL.id]: 0,
		[STATUSES.CHAOS_THRUST.id]: 0,
	}

	constructor(...args){
		super(...args)
		const filter = {
			by: 'player',
			abilityId: [STATUSES.DISEMBOWEL.id, STATUSES.CHAOS_THRUST.id],
		}
		this.addHook(['applydebuff', 'refreshdebuff'], filter, this._onDotApply)
		this.addHook('complete', this._onComplete)
	}

	_onDotApply(event){
		const statusId = event.ability.guid

		const lastApplication = this._lastApplication[event.targetID] = this._lastApplication[event.targetID] || {}
		//Base clip calc
		let clip = STATUS_DURATION[statusId] - (event.timestamp - lastApplication[statusId])
		// Removes untarget time from clipping
		clip -= this.invuln.getUntargetableUptime('all', event.timestamp - STATUS_DURATION[statusId], event.timestamp)
		// Capping the clip to 0
		this._clip[statusId] += Math.max(0, clip)
		lastApplication[statusId] = event.timestamp
	}
	_onComplete(){
		//Checklist rules for uptimes
		this.checklist.add(new Rule({
			name: 'Keep up Disembowel & Chaos Thrust',
			description: <Fragment>
				As a Dragoon, you bring a strong debuff for yourself and Ranged DPS through the use of <ActionLink {...ACTIONS.DISEMBOWEL} />, and you should ideally have the same uptime on <ActionLink {...ACTIONS.CHAOS_THRUST} /> as they are part of the same combo!
			</Fragment>,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.DISEMBOWEL} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.DISEMBOWEL.id),
				}),
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.CHAOS_THRUST} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.CHAOS_THRUST.id),
				}),
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.HEAVY_THRUST} /> uptime </Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.HEAVY_THRUST.id),
				}),
			],
		}))
		//Suggestions for Chaos Thrust Clipping
		const maxClip = Math.max(...Object.values(this._clip))
		this.suggestions.add(new Suggestion({
			icon: STATUSES.CHAOS_THRUST.icon,
			content: <Fragment>
				Avoid trying to use back to back Chaos Thrust comboes on the same target. If you have a Medium Warning, reduce your Skill Speed. Due to the Dragoon Rotation, Minor Clipping is expected.
			</Fragment>,
			severity: (maxClip < 6000? SEVERITY.Minor :( maxClip < 11000? SEVERITY.MEDIUM :( maxClip < 21000? SEVERITY.MAJOR: SEVERITY.MORBID))),
			why: <Fragment>
				{this.parser.formatDuration(this._clip[STATUSES.CHAOS_THRUST.id])} of {STATUSES[STATUSES.CHAOS_THRUST.id].name} lost to early refreshes.
			</Fragment>,
		}))
	}
	getDotUptimePercent(statusId){
		const statusUptime = this.enemies.getStatusUptime(statusId)
		const fightDuration = this.parser.fightDuration - this.invuln.getInvulnerableUptime()
		return (statusUptime / fightDuration) * 100
	}
}
