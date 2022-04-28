import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'

const description = t('whm.about.description')`
This analyser aims to identify some of the low-hanging fruit that could be used to improve your WHM gameplay, as well as give a deeper insight into what happened during an encounter.

If you would like to learn more about WHM, check the guides over at [The Balance](https://thebalanceffxiv.com/), and have a chat in the #whm_questions channel.

Currently this module can track DoT uptime, note when your healing lily gauge is full, detect clipping, detect interrupted casts, and report about missed oGCD casts.

Healing analysis can be very subjective - even if some of the below suggestions do not apply to you, they can help inform you about things you may have missed
`

export const WHITE_MAGE = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-whm" */),
	Description: () => <>
		<TransMarkdown source={description}/>
	</>,
	supportedPatches: {
		from: '6.0',
		to: '6.08',
	},
	contributors: [
		// {user: CONTRIBUTORS.YOU, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.INNI, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.KERRIS, role: ROLES.DEVELOPER},
	],
	changelog: [
		// {
		// 	date: new Date('2021-11-19'),
		// 	Changes: () => <>The changes you made</>,
		// 	contrubutors: [CONTRIBUTORS.YOU],
		// },
		{
			date: new Date('2021-12-30'),
			Changes: () => <>Updated Thin Air Module for charge-based usage, added some weighting on MP saved per cast</>,
			contributors: [CONTRIBUTORS.INNI],
		},
		{
			date: new Date('2022-01-02'),
			Changes: () => <>Updated Overhealing Module to include Liturgy of the bell</>,
			contributors: [CONTRIBUTORS.KERRIS],
		},
		{
			date: new Date('2022-01-04'),
			Changes: () => <>Updated to add defensive cooldowns and include Liturgy of the bell and Aquaveil</>,
			contributors: [CONTRIBUTORS.KERRIS],
		},
		{
			date: new Date('2022-01-09'),
			Changes: () => <>Marked WHM as supported for 6.05</>,
			contributors: [CONTRIBUTORS.INNI],
		},
		{
			date: new Date('2022-01-04'),
			Changes: () => <>Adding Tincture section</>,
			contributors: [CONTRIBUTORS.KERRIS],
		},
		{
			date: new Date('2022-01-25'),
			Changes: () => <>Marked WHM as supported for 6.08</>,
			contributors: [CONTRIBUTORS.INNI],
		},
		{
			date: new Date('2022-04-18'),
			Changes: () => <>Migrate Lily gauge to core gauge, and upade for 6.1 misery analysis</>,
			contributors: [CONTRIBUTORS.KERRIS],
		},
		{
			date: new Date('2022-04-28'),
			Changes: () => <>Added Action Timeline structure</>,
			contributors: [CONTRIBUTORS.INNI],
		},
	],
})
