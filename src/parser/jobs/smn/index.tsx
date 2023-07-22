import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'

const description = t('smn.about.description')`
While the SMN toolkit is very flexible and full optimization will require you to consider each fight and your stats individually, there are still some common guidelines to follow in any fight.

This page will highlight those common rules and provide some additional visualizations of your rotation within a fight that you can use to further refine your gameplay.

If you would like to learn more about SMN, check the guides over at [Akhmorning](https://www.akhmorning.com/jobs/smn/guide/) and [The Balance](https://www.thebalanceffxiv.com/jobs/casters/summoner/), and have a chat in the #smn channels.
`

export const SUMMONER = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-smn" */),

	Description: () => <>
		<TransMarkdown source={description} key="smn.about.description"/>
	</>,
	supportedPatches: {
		from: '6.0',
		to: '6.45',
	},
	contributors: [
		{user: CONTRIBUTORS.KELOS, role: ROLES.MAINTAINER},
	],

	changelog: [
		{
			date: new Date('2023-01-14'),
			Changes: () => <>Removed outdated Swiftcast message.</>,
			contributors: [CONTRIBUTORS.KELOS],
		},
		{
			date: new Date('2022-05-04'),
			Changes: () => <>Fixed an issue that prevented synthing a pre-cast Searing Light.</>,
			contributors: [CONTRIBUTORS.KELOS],
		},
		{
			date: new Date('2022-04-23'),
			Changes: () => <>Updated Searing Light to be sourced from the player in patch 6.1.</>,
			contributors: [CONTRIBUTORS.KELOS],
		},
		{
			date: new Date('2022-02-19'),
			Changes: () => <>Add sorted egis to header.</>,
			contributors: [CONTRIBUTORS.IAOTLE],
		},
		{
			date: new Date('2022-01-29'),
			Changes: () => <>Fix duplicate searing light rows when there are multiple summoners in the party.</>,
			contributors: [CONTRIBUTORS.DEAN],
		},
		{
			date: new Date('2022-01-13'),
			Changes: () => <>Fixed an issue that kept Summon rows from being expanded and collapsed.</>,
			contributors: [CONTRIBUTORS.KELOS],
		},
		{
			date: new Date('2022-01-13'),
			Changes: () => <>Jumping to the timeline from the Searing Light table now has the expected zoom.</>,
			contributors: [CONTRIBUTORS.KELOS],
		},
		{
			date: new Date('2022-01-09'),
			Changes: () => <>Adjusted module display order and now start Summon windows with errors opened.</>,
			contributors: [CONTRIBUTORS.KELOS],
		},
		{
			date: new Date('2022-01-09'),
			Changes: () => <>Corrected the cooldown of Radiant Aegis.</>,
			contributors: [CONTRIBUTORS.KELOS],
		},
		{
			date: new Date('2021-12-28'),
			Changes: () => <>No longer consider Physick casts during downtime as bad.</>,
			contributors: [CONTRIBUTORS.KELOS],
		},
		{
			date: new Date('2021-12-24'),
			Changes: () => <>Improved Searing Light checks when the party contains multiple Summoners.</>,
			contributors: [CONTRIBUTORS.KELOS],
		},
		{
			date: new Date('2021-12-16'),
			Changes: () => <>Implemented Endwalker support</>,
			contributors: [CONTRIBUTORS.KELOS],
		},
	],
})
