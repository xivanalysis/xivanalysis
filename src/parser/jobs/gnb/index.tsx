import {t} from '@lingui/macro'
import React from 'react'

import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import {changelog} from './changelog'

const description = t('gnb.about.description')`This analyzer looks for the low-hanging, easy to spot issues in your gameplay that can be fixed to improve your damage across a fight as Gunbreaker.
If you're looking to learn about how exactly the job plays and functions from the ground up, take a look at a few basic guides:

* [General tanking guide by Aletin](https://goo.gl/nYzAnq)
* [Gunbreaker guide by Aletin](https://docs.google.com/document/d/1gfsMbHP55N5e0UKyc9zfpAdL_uVco40YdBlVNGvyJ0k/edit?usp=sharing)

If you have any suggestions about the module, feel free to ping me on Discord at Lhea#7581.
`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-gnb" */),

	Description: () => <TransMarkdown source={description}/>,

	supportedPatches: {
		from: '5.0',
		to: '5.08',
	},

	contributors: [
		{user: CONTRIBUTORS.LHEA, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.QAPHLA, role: ROLES.DEVELOPER},
	],

	changelog,
})
