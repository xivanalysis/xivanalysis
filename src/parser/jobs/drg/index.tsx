import {Trans} from '@lingui/react'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

export const DRAGOON = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-drg" */),

	Description: () => <>
		<Trans id="drg.about.description">
			<p>
				Never skip leg day. This analyzer aims to help you keep your life on track and in sync with the rest of your buffs in order to make sure that your jumps land with the most impact in your burst windows. As the DRG rotation is pretty strict, the suggestions you see will focus mostly on keeping that rotation flowing smoothly, as well as picking out issues related to your Life of the Dragon windows and buff alignment.</p>
		</Trans>
	</>,

	supportedPatches: {
		from: '7.0',
		to: '7.0',
	},

	contributors: [
		{user: CONTRIBUTORS.FALINDRITH, role: ROLES.MAINTAINER},
	],

	changelog,
})
