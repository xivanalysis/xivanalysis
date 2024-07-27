import {Trans} from '@lingui/macro'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

export const NINJA = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-nin" */),

	Description: () => <>
		<Trans id="nin.about.description">
			<p>Hey there, NIN friend! Are you tired of being looked down on by your VPR and PCT peers? Wish your raid team would stop using you for your Dokumori and appreciate you for who you really are? Well look no further! We'll help you bring yourself all the way up from <strong className="text-grey">this</strong> to <strong className="text-orange">this</strong>*!</p>
			<p>As NIN tends to be more fluid than rotational, this module contains mostly suggestions for ways you can improve your gameplay, rather than strict checklist requirements. If you see a lot, don't panic - just tackle them one at a time.</p>
			<p>*Results not guaranteed. Offer void where prohibited. Please don't sue us.</p>
		</Trans>
	</>,

	supportedPatches: {
		from: '7.0',
		to: '7.01',
	},

	contributors: [
		{user: CONTRIBUTORS.TOASTDEIB, role: ROLES.DEVELOPER},
	],

	changelog,
})
