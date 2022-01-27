import {Trans} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'

export const BARD = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-brd" */),
	Description: () => <>
		<Trans id="brd.about.description">
			<p>Welcome to the Bard module! Despite being a very straightforward job, Bard's complexity is deceiving.</p>
			<p>Considered by many as an <i>"easy to learn, hard to master"</i> job, Bard is a job that relies heavily on decision-making.</p>
			<p>Improvements on Bard can range from the fundamentals of properly utilizing songs (<ActionLink action="THE_WANDERERS_MINUET"/>, <ActionLink action="MAGES_BALLAD"/> and <ActionLink action="ARMYS_PAEON"/>) up to the intricacies of <ActionLink action="IRON_JAWS"/> and the concept of buff/debuff snapshotting.</p>
			<p>This analyzer will guide you through the job's core mechanics, all the way to encounter-specific optimization.</p>
		</Trans>
	</>,
	supportedPatches: {
		from: '6.0',
		to: '6.08',
	},
	contributors: [
		{user: CONTRIBUTORS.HINT, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.YUMIYA, role: ROLES.DEVELOPER},
	],
	changelog: [
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
