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
				TODO: REMOVE OR EDIT THIS. THUNDER UPTIME ISN'T A BIG BLM THING
			</Fragment>,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.THUNDER_3} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.THUNDER_3.id)
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
