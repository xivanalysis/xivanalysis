import {Trans} from '@lingui/macro'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

export const MONK = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-mnk" */),

	Description: () => <>
		<Trans id="mnk.about.description">
			<p>Hello friendly monk!</p>
			<p>This monk analyser aims to help you realise your true potential as a monk by highlighting issues that can
				be difficult to spot in a raw log. The main focus is on your buff windows and ensuring your cooldowns are
				used while providing tips on utility skill usage.
			</p>
			<p>If you notice anything that looks wrong or have a feature idea, please visit our Discord server and report it in the #fb-melee forum.</p>
		</Trans>
	</>,

	supportedPatches: {
		from: '7.01',
		to: '7.05',
	},

	contributors: [
		{user: CONTRIBUTORS.HINT, role: ROLES.DEVELOPER},
	],

	changelog,
})
