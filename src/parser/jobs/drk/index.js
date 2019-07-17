import React from 'react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-drk" */),

	Description: () => <>
		<p>This analyzer focuses on blood and mana usage, and then further explores common resource generation problems such as Blood Weapon usage and dropping GCDs.</p>
		<p>Most of the data in this evaluation tool is simulated, and edge cases from FFLogs can cause weird results.  If something doesn't look right, please report it in the discord.</p>
	</>,
	supportedPatches: {
		from: '5.0',
		to: '5.01',
	},
	contributors: [
		{user: CONTRIBUTORS.ACRI, role: ROLES.THEORYCRAFT},
		{user: CONTRIBUTORS.AZARIAH, role: ROLES.MAINTAINER},
	],
	changelog: [
		{
			date: new Date('2019-07-06'),
			Changes: () => <>Initial release of 5.0 support for Dark Knight</>,
			contributors: [CONTRIBUTORS.AZARIAH],
		},
	],
})
