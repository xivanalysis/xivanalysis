import {Trans} from '@lingui/react'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'

export const DRAGOON = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-drg" */),
	Description: () => <>
		<Trans id="drg.about.description">
			<p>This analyzer aims to help you beat the stereotypes, stay off the floor, and dish out some big juicy numbers. As the DRG rotation is pretty strict, the suggestions you see will focus mostly on keeping that rotation flowing smoothly, as well as picking out issues related to your Life of the Dragon windows and buff alignment.</p>
		</Trans>
	</>,
	supportedPatches: {
		from: '6.0',
		to: '6.45',
	},
	contributors: [
		{user: CONTRIBUTORS.FALINDRITH, role: ROLES.MAINTAINER},
	],
	changelog: [
		{
			date: new Date('2022-09-20'),
			Changes: () => <>Corrected an issue that was causing the suggestion for using Dragon Sight on a partner to appear even when it was used on a partner.</>,
			contributors: [CONTRIBUTORS.FALINDRITH],
		},
		{
			date: new Date('2022-04-24'),
			Changes: () => <>As of 6.1, weaving any jump (except for Stardiver) is no longer a weaving error. Because of this, we now expect both Spineshatter Dive charges to be used with Dragon Sight windows.</>,
			contributors: [CONTRIBUTORS.FALINDRITH],
		},
		{
			date: new Date('2022-04-03'),
			Changes: () => <>Due to changes in 6.08, Life Surge is no longer expected to be in every Lance Charge window.</>,
			contributors: [CONTRIBUTORS.FALINDRITH],
		},
		{
			date: new Date('2022-01-22'),
			Changes: () => <>Lance Charge and Dragon Sight windows now expect uses of oGCDs instead of uses of GCDs.</>,
			contributors: [CONTRIBUTORS.FALINDRITH],
		},
		{
			date: new Date('2022-01-06'),
			Changes: () => <>Added First Brood's Gaze gauge to the Timeline. Added suggestions for errors related to unused or truncated Life of the Dragon windows at the end of a fight.</>,
			contributors: [CONTRIBUTORS.FALINDRITH],
		},
		{
			date: new Date('2022-01-01'),
			Changes: () => <>Corrected a data issue where a pre-pull use of Coerthan Torment was being synthesized and displayed on the Timeline.</>,
			contributors: [CONTRIBUTORS.FALINDRITH],
		},
		{
			date: new Date('2021-12-27'),
			Changes: () => <>Fixed issues with Battle Litany module incorrectly opening and closing windows due to pets mirroring statuses.</>,
			contributors: [CONTRIBUTORS.FALINDRITH],
		},
		{
			date: new Date('2021-12-13'),
			Changes: () => <>Added support for tracking Wyrmwind Thrust. Updated expected GCD count for Battle Litany. Marked DRG as supported for 6.0.</>,
			contributors: [CONTRIBUTORS.FALINDRITH],
		},
		{
			date: new Date('2021-11-30'),
			Changes: () => <>Performed data update, removed gauge tracking from Blood of the Dragon, deleted the Positionals module, updated checklist with new statuses.</>,
			contributors: [CONTRIBUTORS.FALINDRITH],
		},
	],
})
