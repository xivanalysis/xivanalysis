import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'

export default class Buffs extends Module {
	static handle = 'buffs'
	static title = t('sam.buffs.title')`Buffs`
	static dependencies = [
		'checklist',
		'combatants',
		'invuln',
	]

	constructor(...args) {
		super(...args)

		this.addHook('complete', this._onComplete)
	}

	_onComplete() {
		this.checklist.add(new Rule({
			name: <Trans id="sam.buffs.checklist.name"> Keep Shifu and Jinpu up </Trans>,
			description: <Trans id= "sam.buffs.description"> <ActionLink {...ACTIONS.JINPU} /> and <ActionLink {...ACTIONS.SHIFU} /> increases your damage and speed by 13%. Both buffs are key part of Samurai's damage.</Trans>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Trans id = "sam.buffs.checklist.requirement.jinpu.name"> <ActionLink {...ACTIONS.JINPU} /> uptime </Trans>,
					percent: () => this.getUptimePercent(STATUSES.JINPU.id),
				}),

				new Requirement({
					name: <Trans id= "sam.buffs.checklist.requirement.shifu.name"> <ActionLink {...ACTIONS.SHIFU} /> uptime </Trans>,
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
