import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

const description = t('sch.about.description')`
This analyser aims to identify some of the low-hanging fruit that could be used to improve your SCH gameplay, as well as give a deeper insight into what happened during an encounter.

If you would like to learn more about SCH, check the guides over at [The Balance](https://thebalanceffxiv.com/), and have a chat in the #sch_questions channel.
`

export const SCHOLAR = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-sch" */),

	Description: () => <>
		<TransMarkdown source={description} key="sch.about.description"/>
	</>,

	supportedPatches: {
		from: '7.0',
		to: '7.1',
	},

	contributors: [
		{user: CONTRIBUTORS.NONO, role: ROLES.DEVELOPER},
	],

	changelog,
})
