import {Trans} from '@lingui/react'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

export const RED_MAGE = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-rdm" */),

	Description: () => <>
		<Trans id="rdm.about.description">
			<p>This analyzer aims to give you the information you need to turn your <span className="text-success">parses</span> into <span className="text-orange">parses</span></p>
			<p>If you would like to learn more about RDM, check the guides over at <a href="https://thebalanceffxiv.com/">The Balance</a>, and have a chat in the <code>#rdm_questions</code> channel.</p>
		</Trans>
	</>,

	supportedPatches: {
		from: '✖',
		to: '✖',
	},

	contributors: [
	 {user: CONTRIBUTORS.LEYLIA, role: ROLES.DEVELOPER},
	],

	changelog,
})
