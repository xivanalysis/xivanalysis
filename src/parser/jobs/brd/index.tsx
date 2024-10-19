import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

const about = t('brd.about.description')`
Welcome to the Bard module! Although Bard might seem to be a straightforward job on the surface, its complexity can be deceiving.
Considered by many as an "*easy to learn, hard to master*" job, Bards have to make minute-to-minute decisions about their repertoire procs, Damage-over-Time actions, and Soul Voice gauge.

To understand the fundamentals behind the suggestions given below, check out one of the following guides:

- [Icy Veins Bard Guide](https://www.icy-veins.com/ffxiv/bard-guide)
- [The Balance Bard Guide](https://www.thebalanceffxiv.com/jobs/ranged/bard)
`

export const BARD = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-brd" */),

	Description: () => <>
		<TransMarkdown source={about}/>
	</>,

	supportedPatches: {
		from: '7.0',
		to: '7.05',
	},

	contributors: [
		{user: CONTRIBUTORS.YUMIYA, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.YUZUKITSURU, role: ROLES.DEVELOPER},
	],

	changelog,
})
