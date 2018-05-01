import React, { Fragment } from 'react'

import { ActionLink } from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import CoreChecklist, { Rule, Requirement } from 'parser/core/modules/Checklist'

export default class Checklist extends CoreChecklist {
	static dependencies = [
		'enemies'
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
					percent: () => (this.enemies.getStatusUptime(STATUSES.BIO_III.id) / this.parser.fightDuration) * 100
				}),
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.MIASMA_III}/> uptime</Fragment>,
					percent: () => (this.enemies.getStatusUptime(STATUSES.MIASMA_III.id) / this.parser.fightDuration) * 100
				})
			]
		})
	]
}
