import {Trans} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {Meta} from 'parser/core/Meta'
import React from 'react'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-drk" */),

	Description: () => <>
		<Trans id="drk.about.description">
			<p>This analyzer aims to help you unleash your inner edge.
				The core of Dark Knight offense focuses on maximizing blood and MP utilization, in raid buff windows where available.
				In addition, you should aim to land five hits in each Blood Weapon and Delirium window.</p>
			<p>Defensively, <ActionLink {...ACTIONS.THE_BLACKEST_NIGHT}/> is a powerful cooldown that can mitigate heavy damage on you or a target,
				and grants a free use of Edge of Shadow or Flood of Shadow as long as the shield is fully consumed.</p>
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
