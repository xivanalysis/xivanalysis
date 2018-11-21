import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'


export default class Buffs extends Module {
	static handle = 'buffs'
	static dependencies = [
		'checklist',
		'combatants',
		'invuln',
		'suggestions',
	]

	constructor(...args) {
		super(...args)

		this.addHook('complete', this._onComplete)
	}

	_onComplete() {
		this.checklist.add(new Rule({
			name: 'Keep Shifu and Jinpu up',
			description: 'Jinpu increases your damage by 10% and Shifu increases your speed by 10%. Both buffs are key part of Samurai\'s damage.',
			target: 95,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.JINPU} /> uptime</Fragment>,
					percent: () => this.getUptimePercent(STATUSES.JINPU.id),
				}),

				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.SHIFU} /> uptime</Fragment>,
					percent: () => this.getUptimePercent(STATUSES.SHIFU.id),
				}),

			],
		}))
	}

	getUptimePercent(StatusId) {
		const statusUptime = this.combatants.getStatusUptime((StatusId), this.parser.player.id)
		const fightUptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightUptime) * 100
	}

}
