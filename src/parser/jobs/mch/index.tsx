import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

const about = t('mch.about.description')`
Welcome to the Machinist module! This job is all about managing cooldowns to dish out as much damage as possible,
especially during your party's raid buff windows. This page will walk you through how well you utilized each of your major
cooldowns and resources.

To understand the fundamentals behind the suggestions given below, check out one of the following guides:

- [Icy Veins Machinist Guide](https://www.icy-veins.com/ffxiv/machinist-guide)
- [The Balance Machinist Guide](https://www.thebalanceffxiv.com/jobs/ranged/machinist/)
`

export const MACHINIST = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-mch" */),

	Description: () => <>
		<TransMarkdown source={about}/>
	</>,

	supportedPatches: {
		from: '7.0',
		to: '7.05',
	},

	contributors: [
		{user: CONTRIBUTORS.HINT, role: ROLES.DEVELOPER},
	],

	changelog,
})
