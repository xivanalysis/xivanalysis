import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {Meta} from 'parser/core/Meta'
import React from 'react'

export const BLACK_MAGE = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-blm" */),

	Description: () => <>
		<Trans id="blm.about.description">This analyser aims to identify how you're not actually casting <ActionLink {...ACTIONS.FIRE_IV} /> as much as you think you are.</Trans>
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
