import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import {Meta} from 'parser/core/Meta'
import React from 'react'

const description = t('smn.about.description')`
This analyser aims to identify some of the low-hanging fruit that could be used to improve your SMN gameplay, as well as give a deeper insight into what happened during an encounter.

Due to the nature of how SMN plays, there may be a near _overwhelming_ number of suggestions showing up below. Don't fret it, just focus on one or two improvements at a time.

If you would like to learn more about SMN, check the guides over at [Akhmorning](http://www.akhmorning.com/guide/intro/), the resources at [The Balance](https://thebalanceffxiv.com/), and have a chat in the #smn channels.
`

export const SUMMONER = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-smn" */),

	Description: () => <>
		<TransMarkdown source={description} key="smn.about.description"/>
	</>,
	// supportedPatches: {
	// 	from: '6.0',
	// 	to: '6.0',
	// },
	contributors: [
		// {user: CONTRIBUTORS.YOU, role: ROLES.DEVELOPER},
	],

	changelog: [
		// {
		// 	date: new Date('2021-11-19'),
		// 	Changes: () => <>The changes you made</>,
		// 	contrubutors: [CONTRIBUTORS.YOU],
		// },
	],
})
