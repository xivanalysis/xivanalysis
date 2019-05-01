import {t} from '@lingui/macro'
import {Meta} from 'analyser/Meta'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import React from 'react'

const description = t('smn.about.description')`
This analyser aims to identify some of the low-hanging fruit that could be used to improve your SMN gameplay, as well as give a deeper insight into what happened during an encounter.

Due to the nature of how SMN plays, there may be a near _overwhelming_ number of suggestions showing up below. Don't fret it, just focus on one or two improvements at a time.

If you would like to learn more about SMN, check the guides over at [The Balance](https://thebalanceffxiv.com/), and have a chat in the #smn_questions channel.
`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-smn" */),

	supportedPatches: {
		from: '4.2',
		to: '4.5',
	},

	Description: () => <TransMarkdown source={description}/>,

	contributors: [
		{user: CONTRIBUTORS.ACKWELL, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.NEMEKH, role: ROLES.THEORYCRAFT},
		{user: CONTRIBUTORS.FRYTE, role: ROLES.THEORYCRAFT},
	],
})
