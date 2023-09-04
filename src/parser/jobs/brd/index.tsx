import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'

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
		from: '6.0',
		to: '6.45',
	},
	contributors: [
		{user: CONTRIBUTORS.HINT, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.YUMIYA, role: ROLES.DEVELOPER},
	],
	changelog: [
		{
			date: new Date('2023-07-02'),
			Changes: () => <>Marked as supported for 6.4.</>,
			contributors: [CONTRIBUTORS.HINT],
		},
		{
			date: new Date('2023-06-05'),
			Changes: () => <>Display timestamps for Straight Shot Ready overwrites.</>,
			contributors: [CONTRIBUTORS.MALI],
		},
		{
			date: new Date('2023-01-14'),
			Changes: () => <>Updated for patch 6.3.</>,
			contributors: [CONTRIBUTORS.HINT],
		},
		{
			date: new Date('2023-01-08'),
			Changes: () => <>Updated the "About" section.</>,
			contributors: [CONTRIBUTORS.HINT],
		},
		{
			date: new Date('2022-01-24'),
			Changes: () => <>Added Apex Arrow and Blast Arrow tracker in Raging Strikes windows. Also fixed the incorrect expected usage amount of Empyreal Arrows in the cooldowns checklist.</>,
			contributors: [CONTRIBUTORS.YUMIYA],
		},
		{
			date: new Date('2022-01-14'),
			Changes: () => <>Fixed an issue with "Always be casting" calculations.</>,
			contributors: [CONTRIBUTORS.HINT],
		},
		{
			date: new Date('2022-01-09'),
			Changes: () => <>Added Empyreal Arrow drift module and tracker for Bloodletter/Rain of Death in Raging Strikes windows.</>,
			contributors: [CONTRIBUTORS.YUMIYA],
		},
		{
			date: new Date('2022-01-06'),
			Changes: () => <>Marked as supported for 6.05.</>,
			contributors: [CONTRIBUTORS.HINT],
		},
		{
			date: new Date('2022-01-01'),
			Changes: () => <>Added Radiant Finale and Battle Voice tracker in Raging Strikes module, as well as suggestion to use them in a timely manner.</>,
			contributors: [CONTRIBUTORS.YUMIYA],
		},
		{
			date: new Date('2021-12-17'),
			Changes: () => <>Updated Bard modules for Endwalker.</>,
			contributors: [CONTRIBUTORS.HINT],
		},
	],
})
