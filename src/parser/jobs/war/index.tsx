import {Trans} from '@lingui/react'
import {Meta} from 'parser/core/Meta'
import React from 'react'

export const WARRIOR = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-war" */),

	Description: () => <>
		<Trans id="war.about.description">
			<p>This analyser aims to identify some of the low-hanging fruit that could be used to improve your WAR gameplay,
					as well as give a deeper insight into what happened during an encounter.</p>
			<p>If you notice anything that looks particularly wrong, please visit our Discord server and report it in the #support channel.</p>
		</Trans>
	</>,
	// supportedPatches: {
	// 	from: '6.0',
	// 	to: '6.0',
	// },
	contributors: [
		// {user: CONTRIBUTORS.YOU, role: ROLES.DEVELOPER},
	],

	changelog: [
		// {
		// 	date: new Date('2021-11-19'),
		// 	Changes: () => <>The changes you made</>,
		// 	contrubutors: [CONTRIBUTORS.YOU],
		// },
	],
})
