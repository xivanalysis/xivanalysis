import _ from 'lodash'
import React, {Fragment} from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const STANCES = [
	STATUSES.FISTS_OF_EARTH.id,
	STATUSES.FISTS_OF_FIRE.id,
	STATUSES.FISTS_OF_WIND.id,
]

const STANCELESS_SEVERITY = {
	1: SEVERITY.MEDIUM,
	12: SEVERITY.MAJOR,
}

export default class Fists extends Module {
	static handle = 'fists'
	static dependencies = [
		'checklist',
		'combatants',
		'invuln',
		'suggestions',
	]

	_stanceApplied = []
	_stanceDropped = []
	_stanceless = 0

	constructor(...args) {
		super(...args)
		this.addHook('applybuff', {to: 'player', abilityId: STANCES}, this._onGain)
		this.addHook('removebuff', {to: 'player', abilityId: STANCES}, this._onRemove)
		this.addHook('complete', this._onComplete)
	}

	_onGain(event) {
		if (this._stanceDropped.length > 0) {
			this._stanceless += event.timestamp - _.last(this._stanceDropped).timestamp
		}

		this._stanceApplied.push(event)
		return
	}

	_onRemove(event) {
		this._stanceDropped.push(event)
	}

	_onComplete() {
		this.checklist.add(new Rule({
			name: 'Keep Fists of Fire up',
			description: <Fragment>
				Fists of Fire is a low effort 5% buff to all your damage.
			</Fragment>,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.FISTS_OF_FIRE} /> uptime</Fragment>,
					percent: () => this.getBuffUptimePercent(STATUSES.FISTS_OF_FIRE.id),
				}),
			],
			target: 90,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FISTS_OF_FIRE.icon,
			content: <Fragment>
				Fist buffs are one of your biggest DPS contributors, either directly with <ActionLink {...ACTIONS.FISTS_OF_FIRE} /> or <StatusLink {...STATUSES.GREASED_LIGHTNING_I} /> manipulation with <ActionLink {...ACTIONS.FISTS_OF_EARTH} /> and <ActionLink {...ACTIONS.FISTS_OF_WIND} />.
			</Fragment>,
			why: `No Fist buff was active for ${this.parser.formatDuration(this._stanceless)}.`,
			tiers: STANCELESS_SEVERITY,
			value: this._stanceless,
		}))
	}

	getBuffUptimePercent(statusId) {
		const statusUptime = this.combatants.getStatusUptime(statusId, this.parser.player.id)
		const fightUptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightUptime) * 100
	}
}
