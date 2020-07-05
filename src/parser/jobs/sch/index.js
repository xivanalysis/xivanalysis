import {t} from '@lingui/macro'
import React from 'react'

import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

const description = t('sch.about.description')`
This analyser aims to identify some of the low-hanging fruit that could be used to improve your SCH gameplay, as well as give a deeper insight into what happened during an encounter.

If you would like to learn more about SCH, check the guides over at [The Balance](https://thebalanceffxiv.com/), and have a chat in the #sch_questions channel.
`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-sch" */),

	Description: () => <>
		<TransMarkdown source={description} key="sch.about.description"/>
	</>,
	supportedPatches: {
		from: '5.0',
		to: '5.2',
	},
	contributors: [
		{user: CONTRIBUTORS.LIMA, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.NONO, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.SUSHIROU, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.NIV, role: ROLES.DEVELOPER},
	],
	changelog: [{
		date: new Date('2020-06-30'),
		Changes: () => <>Add potions as a module – show up with all the move used under them.</>,
		contributors: [CONTRIBUTORS.NONO],
	},
	{
		date: new Date('2020-05-16'),
		Changes: () => <>Added Recitation and Overheal visualization to SCH – huge thanks to people in #sch_lounge in the balance for feedback with content!</>,
		contributors: [CONTRIBUTORS.NONO],
	},
	{
		date: new Date('2020-04-07'),
		Changes: () => <>Add Faerie actions to timeline</>,
		contributors: [CONTRIBUTORS.NONO],
	},
	{
		date: new Date('2020-02-18'),
		Changes: () => <>Support for 5.2; happy raiding SCHs!</>,
		contributors: [CONTRIBUTORS.NONO],
	},
	{
		date: new Date('2019-10-29'),
		Changes: () => <>Support for 5.1; additionally, only warn on faerie gauge overcap starting at 50</>,
		contributors: [CONTRIBUTORS.NONO],
	},
	{
		date: new Date('2019-09-19'),
		Changes: () => <>Track interrupts; a big thanks to Tonto Draksbane and Yuni in the balance for help with this feature</>,
		contributors: [CONTRIBUTORS.NONO],
	},
	{
		date: new Date('2019-08-09'),
		Changes: () => <>
			Initial support for Shadowbringers:&nbsp;
			<ul>
				<li>Add gauge tracking</li>
				<li>Track Chain Strategem use</li>
				<li>Fix issue with Recitation creating negative Aetherflow counts</li>
				<li>Add Energy Drain back as a valid Aetherflow consumer</li>
			</ul>
		</>,
		contributors: [CONTRIBUTORS.NONO],
	},
	{
		date: new Date('2019-07-12'),
		Changes: () => <>
			Initial changes for Shadowbringers:&nbsp;
			<ul>
				<li>Updated 5.0 action list</li>
				<li>Updated DoT module to check Biolysis</li>
				<li>Removed outdated modules and actions</li>
			</ul>
		</>,
		contributors: [CONTRIBUTORS.NIV],
	}],
})
