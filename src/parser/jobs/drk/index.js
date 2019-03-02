import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

//import ACTIONS from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
//import {ActionLink} from 'components/ui/DbLink'

export default {
	modules: () => import('./modules' /* webpackChunkName: "jobs-drk" */),

	description: <Fragment>
		<p>This analyzer focuses on blood and mana usage, and then further explores common resource generation problems such as Blood Weapon usage and dropping GCDs.</p>
		<p>Most of the data in this evaluation tool is simulated, and edge cases from FFLogs can cause weird results.  If something doesn't look right, please report it in the discord.</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				Full capabilities of this tool require logs to be from the current patch.  Logs from 4.2 and before will not be accurately evaluated for resources due to job changes.
			</Message.Content>
		</Message>
	</Fragment>,
	supportedPatches: {
		from: '4.3',
		to: '4.5',
	},
	contributors: [
		{user: CONTRIBUTORS.ACRI, role: ROLES.THEORYCRAFT},
		{user: CONTRIBUTORS.AZARIAH, role: ROLES.MAINTAINER},
	],
	changelog: [
		{
			date: new Date('2019-01-25'),
			changes: 'Update analyzer for 4.5 patch, remove inaccurate recommendation for DA usage during enmity combo.',
			contributors: [CONTRIBUTORS.AZARIAH],
		},
		{
			date: new Date('2019-02-18'),
			changes: 'Change to tracking Blood Weapon & Delirium as oGCDs instead of normalized uptime.  Add suggestions for dropped GCDs and wasted Deliriums.',
			contributors: [CONTRIBUTORS.AZARIAH],
		},
	],
}
