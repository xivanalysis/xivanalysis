import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'

const description = t('sch.about.description')`
This analyser aims to identify some of the low-hanging fruit that could be used to improve your SCH gameplay, as well as give a deeper insight into what happened during an encounter.

If you would like to learn more about SCH, check the guides over at [The Balance](https://thebalanceffxiv.com/), and have a chat in the #sch_questions channel.
`

export const SCHOLAR = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-sch" */),

	Description: () => <>
		<TransMarkdown source={description} key="sch.about.description"/>
	</>,
	// supportedPatches: {
	// 	from: '6.0',
	// 	to: '6.0',
	// },
	contributors: [
		{user: CONTRIBUTORS.MYPS, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.DTHOMASH, role: ROLES.DEVELOPER},
	],
	changelog: [
		{
			date: new Date('2021-12-19'),
			Changes: () => <>Initial Endwalker data update.</>,
			contributors: [CONTRIBUTORS.MYPS],
		},
		{
			date: new Date('2022-01-04'),
			Changes: () => <>Update tracked cooldowns to add Aetherflow and make Chain Strategem calculations a bit stricter.</>,
			contributors: [CONTRIBUTORS.DTHOMASH],
		},
	],
})
