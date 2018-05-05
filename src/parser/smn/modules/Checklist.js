import React, { Fragment } from 'react'

import { ActionLink } from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import CoreChecklist, { Rule, Requirement } from 'parser/core/modules/Checklist'

export default class Checklist extends CoreChecklist {
	static dependencies = [
		'cooldowns',
		'enemies',
		'invuln'
	]

	rules = [
		new Rule({
			name: 'Keep your DoTs up',
			description: <Fragment>
				As a Summoner, DoTs are significant portion of your sustained damage, and are required for optimal damage from <ActionLink {...ACTIONS.FESTER}/>, your primary stack spender. Aim to keep them up at all times.
			</Fragment>,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.BIO_III}/> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.BIO_III.id)
				}),
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.MIASMA_III}/> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.MIASMA_III.id)
				})
			]
		}),
		new Rule({
			name: <Fragment>Keep <ActionLink {...ACTIONS.AETHERFLOW}/>&apos;s cooldown rolling</Fragment>,
			description: 'SMN\'s entire kit revolves around the Aetherflow cooldown. Make sure you squeeze every possible use out of it that you can.',
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.AETHERFLOW} /> cooldown uptime</Fragment>,
					percent: () => (this.cooldowns.getTimeOnCooldown(ACTIONS.AETHERFLOW) / this.parser.fightDuration) * 100
				})
			]
		})
	]

	getDotUptimePercent(statusId) {
		const statusUptime = this.enemies.getStatusUptime(statusId)
		let fightDuration = this.parser.fightDuration

		fightDuration -= this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}
}
