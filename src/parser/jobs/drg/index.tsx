import {Trans} from '@lingui/react'
// import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

export const DRAGOON = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-drg" */),

	Description: () => <>
		<Trans id="drg.about.description">
			<p>This analyzer aims to help you beat the stereotypes, stay off the floor, and dish out some big juicy numbers. As the DRG rotation is pretty strict, the suggestions you see will focus mostly on keeping that rotation flowing smoothly, as well as picking out issues related to your Life of the Dragon windows and buff alignment.</p>
		</Trans>
	</>,

	supportedPatches: {
		from: '✖',
		to: '✖',
	},

	contributors: [
		// {user: CONTRIBUTORS.YOU, role: ROLES.YOUR_ROLE},
	],

	changelog,
})
