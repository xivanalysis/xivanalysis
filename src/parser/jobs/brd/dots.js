import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'

export default class DoTs extends Module {
	static handle = 'dots'
	static dependencies = [
		'checklist',
		'enemies',
		'invuln',
	]

	constructor(...args) {
		super(...args)
		this.addHook('complete', this._onComplete)
	}

	_onComplete() {
		// Checklist rule for dot uptime
		this.checklist.add(new Rule({
			name: 'Keep your DoTs up',
			description: <Fragment>
				Brd + Dots = <img src="https://i.imgur.com/YzbDyRg.png" alt="blobmorning" height="27" width="32"></img>
			</Fragment>,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.CAUSTIC_BITE} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.CAUSTIC_BITE.id),
				}),
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.STORMBITE} /> uptime</Fragment>,
					percent: () => this.getDotUptimePercent(STATUSES.STORMBITE.id),
				}),
			],
		}))
	}

	getDotUptimePercent(statusId) {
		const statusUptime = this.enemies.getStatusUptime(statusId)
		let fightDuration = this.parser.fightDuration

		fightDuration -= this.invuln.getInvulnerableUptime()

		return (statusUptime / fightDuration) * 100
	}
}
