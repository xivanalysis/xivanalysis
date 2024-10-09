import {Trans} from '@lingui/react'
// import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

export const REAPER = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-rpr" */),

	Description: () => <>
		<Trans id="rpr.about.description">
			<p>This analyser aims to identify some of the low-hanging fruit that could be used to improve your RPR gameplay,
					as well as give a deeper insight into what happened during an encounter.</p>
			<p>If you notice anything that looks particularly wrong, please visit our Discord server and report it in the #fb-reaper channel.</p>
		</Trans>
	</>,

	supportedPatches: {
		from: '7.0',
		to: '7.05',
	},

	contributors: [
	// {user: CONTRIBUTORS.YOU, role: ROLES.YOUR_ROLE},
	],

	changelog,
})
