import React from 'react'
import {Trans} from '@lingui/react'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-drk" */),

	Description: () => <>
		<Trans id="drk.about.description">
			<p>This analyzer focuses on blood and mana usage, and then further explores common resource generation problems such as Blood Weapon usage and dropping GCDs.</p>
			<p>Most of the data in this evaluation tool is simulated, and edge cases from FFLogs can cause weird results.  If something doesn't look right, please report it in the discord.</p>
		</Trans>
	</>,
	supportedPatches: {
		from: '5.0',
		to: '5.08',
	},
	contributors: [
		{user: CONTRIBUTORS.ACRI, role: ROLES.THEORYCRAFT},
		{user: CONTRIBUTORS.AZARIAH, role: ROLES.MAINTAINER},
	],
	changelog: [
		{
			date: new Date('2019-07-28'),
			Changes: () => <>Add i18n support</>,
			contributors: [CONTRIBUTORS.AZARIAH],
		},
		{
			date: new Date('2019-07-27'),
			Changes: () => <>Add tracking for Blood Weapon windows</>,
			contributors: [CONTRIBUTORS.AZARIAH],
		},
		{
			date: new Date('2019-07-20'),
			Changes: () => <>Fix issues with gauge calculation and AOE skill tracking</>,
			contributors: [CONTRIBUTORS.AZARIAH],
		},
		{
			date: new Date('2019-07-06'),
			Changes: () => <>Initial release of 5.0 support for Dark Knight</>,
			contributors: [CONTRIBUTORS.AZARIAH],
		},
	],
})
