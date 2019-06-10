import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-drk" */),

	Description: () => <>
		<p>This analyzer focuses on blood and mana usage, and then further explores common resource generation problems such as Blood Weapon usage and dropping GCDs.</p>
		<p>Most of the data in this evaluation tool is simulated, and edge cases from FFLogs can cause weird results.  If something doesn't look right, please report it in the discord.</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				Full capabilities of this tool require logs to be from the current patch.  Logs from 4.2 and before will not be accurately evaluated for resources due to job changes.
			</Message.Content>
		</Message>
	</>,
	// supportedPatches: {
	// 	from: '4.3',
	// 	to: '4.5',
	// },
	contributors: [
		{user: CONTRIBUTORS.ACRI, role: ROLES.THEORYCRAFT},
		{user: CONTRIBUTORS.AZARIAH, role: ROLES.MAINTAINER},
	],
	changelog: [
	],
})
