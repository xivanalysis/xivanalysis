import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

const description = t('smn.about.description')`
While the SMN toolkit is very flexible and full optimization will require you to consider each fight and your stats individually, there are still some common guidelines to follow in any fight.

This page will highlight those common rules and provide some additional visualizations of your rotation within a fight that you can use to further refine your gameplay.

If you would like to learn more about SMN, check the guides over at [The Balance](https://www.thebalanceffxiv.com/jobs/casters/summoner/), and have a chat in the #smn channels.
`

export const SUMMONER = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-smn" */),

	Description: () => <>
		<TransMarkdown source={description} key="smn.about.description"/>
	</>,

	supportedPatches: {
		from: '7.0',
		to: '7.05',
	},

	contributors: [
		{user: CONTRIBUTORS.KELOS, role: ROLES.DEVELOPER},
	],

	changelog,
})
