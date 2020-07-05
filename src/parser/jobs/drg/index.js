import {Trans} from '@lingui/react'
import React from 'react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-drg" */),
	Description: () => <>
		<Trans id="drg.about.description">
			<p>This analyzer aims to help you beat the sterotypes, stay off the floor, and dish out some big juicy numbers. As the DRG rotation is pretty strict, the suggestions you see will focus mostly on keeping that rotation flowing smoothly, as well as picking out issues related to your Life of the Dragon windows and buff alignment.</p>
		</Trans>
	</>,
	supportedPatches: {
		from: '5.0',
		to: '5.2',
	},
	contributors: [
		{user: CONTRIBUTORS.TOASTDEIB, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.ASTRALEAH, role: ROLES.THEORYCRAFT},
		{user: CONTRIBUTORS.FALINDRITH, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.RIETTY, role: ROLES.DEVELOPER},
	],
	changelog: [{
		date: new Date('2020-06-29'),
		Changes: () => <>Added Geirskogul to cooldowns section & enabled Tincture module.</>,
		contributors: [CONTRIBUTORS.RIETTY],
	},
	{
		date: new Date('2020-06-20'),
		Changes: () => <>Added module to track Battle Litany.</>,
		contributors: [CONTRIBUTORS.FALINDRITH],
	},
	{
		date: new Date('2020-06-20'),
		Changes: () => <>Fixed a small issue with the Ability Drift module. It won't break now on using it on lower level content/or logs that have no casts of GSK or HJ.</>,
		contributors: [CONTRIBUTORS.RIETTY],
	},
	{
		date: new Date('2020-06-04'),
		Changes: () => <>Added module to calculate and display drifting of High Jump and Geirskogul, which affects possible Life of the Dragon windows that may have been missed.</>,
		contributors: [CONTRIBUTORS.RIETTY],
	},
	{
		date: new Date('2020-01-12'),
		Changes: () => <>Enhanced analysis for Life of the Dragon windows. Added suggestions for windows with missing casts and buffs.</>,
		contributors: [CONTRIBUTORS.FALINDRITH],
	},
	{
		date: new Date('2019-12-07'),
		Changes: () => <>Added tracking for oGCDs, including jumps, buffs, and Life Surge</>,
		contributors: [CONTRIBUTORS.FALINDRITH],
	},
	{
		date: new Date('2019-11-21'),
		Changes: () => <>Added Positionals module to track usage of Raiden Thrust.</>,
		contributors: [CONTRIBUTORS.FALINDRITH],
	},
	{
		date: new Date('2019-11-12'),
		Changes: () => <>Updated Life of the Dragon to display active buffs during each window. Added a window delay note to help line up buffs.</>,
		contributors: [CONTRIBUTORS.FALINDRITH],
	},
	{
		date: new Date('2019-07-21'),
		Changes: () => <>Updated Lance Charge/Dragon Sight window analysis logic, made some small text and data corrections.</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	},
	{
		date: new Date('2019-07-07'),
		Changes: () => <>Updated combos to properly account for Raiden Thrust, fixed the Disembowel checklist item.</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	},
	{
		date: new Date('2019-07-05'),
		Changes: () => <>
			Initial changes for Shadowbringers:&nbsp;
			<ul>
				<li>Updated the Blood of the Dragon simulation to account for trait changes</li>
				<li>Temporarily disabled the Rotation Watchdog module until it's updated</li>
				<li>Removed outdated modules</li>
			</ul>
		</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	}],
})
