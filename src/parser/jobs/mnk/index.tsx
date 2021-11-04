import {Trans} from '@lingui/macro'
import {Meta} from 'parser/core/Meta'
import React from 'react'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-mnk" */),

	Description: () => <>
		<Trans id="mnk.about.description">
			<p>Hello friendly monk! Do you not Crit the Boot? Does your Six-Sided Star dream remain a meme?</p>
			<p>This monk analyser aims to help you realise your true potential as a monk by highlighting issues that can
				be difficult to spot in a raw log. The main focus is on your buff windows, buff uptime,
				and ensuring your cooldowns are used while providing tips on utility skill usage.
			</p>
			<p>If you notice anything that looks wrong or have a feature idea, please visit our Discord server and report it in the #fb-monk channel.</p>
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
