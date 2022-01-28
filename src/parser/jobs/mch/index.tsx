import {Trans} from '@lingui/macro'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'

export const MACHINIST = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-mch" */),
	Description: () => <>
		<Trans id="mch.about.description">
			<p>BOB! <strong>DO SOMETHING!</strong></p>
			<p>This module aims to help you improve your MCH gameplay by analyzing things that are difficult to spot in raw logs and pointing out ways to keep your rotation tight, keep your tools on cooldown, make your Wildfire windows as strong as possible, and get the most out of the best pet any job has right now.</p>
		</Trans>
	</>,
	supportedPatches: {
		from: '6.0',
		to: '6.08',
	},
	contributors: [
		{user: CONTRIBUTORS.HINT, role: ROLES.MAINTAINER},
	],
	changelog: [
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
