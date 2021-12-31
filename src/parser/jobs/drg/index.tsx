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
		to: '6.0',
	},
	contributors: [
		{user: CONTRIBUTORS.FALINDRITH, role: ROLES.MAINTAINER},
	],
	changelog: [
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
