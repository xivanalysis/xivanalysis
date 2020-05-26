import {Trans} from '@lingui/react'
import React from 'react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-mch" */),
	Description: () => <>
		<Trans id="mch.about.description">
			<p>BOB! <strong>DO SOMETHING!</strong></p>
			<p>This module aims to help you improve your MCH gameplay by analyzing things that are difficult to spot in raw logs and pointing out ways to keep your rotation tight, keep your tools on cooldown, make your Wildfire windows as strong as possible, and get the most out of the best pet any job has right now.</p>
		</Trans>
	</>,
	supportedPatches: {
		from: '5.0',
		to: '5.2',
	},
	contributors: [
		{user: CONTRIBUTORS.TOASTDEIB, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.YUMIYAFANGIRL, role: ROLES.DEVELOPER},
	],
	changelog: [{
		date: new Date('2020-05-13'),
		Changes: () => <>Added a module that shows misused AoE actions.</>,
		contributors: [CONTRIBUTORS.YUMIYAFANGIRL],
	},
	{
		date: new Date('2020-05-10'),
		Changes: () => <>Added a module for tracking GCD drift and a 'Use your cooldowns' checklist item.</>,
		contributors: [CONTRIBUTORS.YUMIYAFANGIRL],
	},
	{
		date: new Date('2019-07-23'),
		Changes: () => <>Added a module for tracking Automaton Queen use.</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	},
	{
		date: new Date('2019-07-16'),
		Changes: () => <>Added a module for tracking Reassemble use.</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	},
	{
		date: new Date('2019-07-11'),
		Changes: () => <>Removed obsolete modules, updated gauge simulation, updated Wildfire and Overheat suggestions, added combo support.</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	}],
})
