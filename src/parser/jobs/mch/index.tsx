import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'

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
		from: '6.0',
		to: '6.45',
	},
	contributors: [
		{user: CONTRIBUTORS.HINT, role: ROLES.MAINTAINER},
	],
	changelog: [
		{
			date: new Date('2023-07-08'),
			Changes: () => <>Fixed a rare bug that erroneously marked Wildfire as dealing 0 damage.</>,
			contributors: [CONTRIBUTORS.HINT],
		},
		{
			date: new Date('2023-07-02'),
			Changes: () => <>Updated Hypercharge module to properly end after all 5 stacks are expended.</>,
			contributors: [CONTRIBUTORS.HINT],
		},
		{
			date: new Date('2023-01-14'),
			Changes: () => <>Added Dismantle and a statistic for defensive cooldown usage, updated the Hypercharge module, and rewrote the "About" section for patch 6.3.</>,
			contributors: [CONTRIBUTORS.HINT],
		},
		{
			date: new Date('2022-11-30'),
			Changes: () => <>Relaxed the suggestion thresholds for Heat overcap.</>,
			contributors: [CONTRIBUTORS.HINT],
		},
		{
			date: new Date('2022-02-09'),
			Changes: () => <>Moved gauge to a resource graph in the timeline.</>,
			contributors: [CONTRIBUTORS.HINT],
		},
		{
			date: new Date('2022-02-02'),
			Changes: () => <>Fixed AlwaysBeCasting module when Flamethrower is used.</>,
			contributors: [CONTRIBUTORS.DEAN],
		},
		{
			date: new Date('2022-01-28'),
			Changes: () => <>Fixed a rare bug that erroneously marked Reassembles as dropped.</>,
			contributors: [CONTRIBUTORS.HINT],
		},
		{
			date: new Date('2022-01-06'),
			Changes: () => <>Marked as supported for 6.05.</>,
			contributors: [CONTRIBUTORS.HINT],
		},
		{
			date: new Date('2021-12-17'),
			Changes: () => <>Added a new Wildfire module.</>,
			contributors: [CONTRIBUTORS.HINT],
		},
		{
			date: new Date('2021-12-08'),
			Changes: () => <>Updated Machinist modules for Endwalker.</>,
			contributors: [CONTRIBUTORS.HINT],
		},
	],
})
