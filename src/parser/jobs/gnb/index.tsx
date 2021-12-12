import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

const description = t('gnb.about.description')`This analyzer looks for the low-hanging, easy to spot issues in your gameplay that can be fixed to improve your damage across a fight as Gunbreaker.
If you're looking to learn about how exactly the job plays and functions from the ground up, take a look at a few basic guides:

* [General tanking guide by Aletin](https://goo.gl/nYzAnq)
* [Gunbreaker guide on SaltedXIV](https://saltedxiv.com/guides/gnb)
* [No Mercy Windows by Rin Karigani](https://i.imgur.com/o8hza9e.png)

If you have any suggestions about the module, feel free to join the XIVA discord and use the feedback channels.
`

export const GUNBREAKER = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-gnb" */),

	Description: () => <TransMarkdown source={description}/>,

	// supportedPatches: {
	// 	from: '6.0',
	// 	to: '6.0',
	// },

	contributors: [
		{user: CONTRIBUTORS.RYAN, role: ROLES.DEVELOPER},
	],

	changelog: [
		// {
		// 	date: new Date('2020-04-20'),
		// 	Changes: () => <>The changes you made</>,
		// 	contrubutors: [CONTRIBUTORS.YOU],
		// },
		{
			date: new Date('2021-12-11'),
			Changes: () => <>
				<ul>
					<li>GNB updated to include 6.0 Actions/Statues on timeline.</li>
					<li>Cooldown adjusted to include Double Down / New Opener.</li>
				</ul>,
			</>,
			contributors: [CONTRIBUTORS.RYAN],
		},
	],
})
