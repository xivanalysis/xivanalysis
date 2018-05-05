import React, { Fragment } from 'react'

import { ActionLink } from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import { Rule, Requirement } from 'parser/core/modules/Checklist'

export default class DoTs extends Module {
	static dependencies = [
		'checklist',
		'enemies',
		'invuln'
	]

	on_complete() {
		// Checklist rule for dot uptime
		this.checklist.add(new Rule({
			name: 'Keep your DoTs up',
			description: <Fragment>
				As a Summoner, DoTs are significant portion of your sustained damage, and are required for optimal damage from <ActionLink {...ACTIONS.FESTER} />, your primary stack spender. Aim to keep them up at all times.
			</Fragment>,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.BIO_III} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.BIO_III.id)
				}),
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.MIASMA_III} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.MIASMA_III.id)
				})
			]
		}))
	}

	getDotUptimePercent(statusId) {
		const statusUptime = this.enemies.getStatusUptime(statusId)
		let fightDuration = this.parser.fightDuration

		fightDuration -= this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}
}
