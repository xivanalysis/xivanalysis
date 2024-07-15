import {Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

export const DARK_KNIGHT = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-drk" */),

	Description: () => <>
		<Trans id="drk.about.description">
			<p>This analyzer aims to help you unleash your inner edge.
				The core of Dark Knight offense focuses on maximizing blood and MP utilization, in raid buff windows where available.
				In addition, you should aim to land five hits in each Blood Weapon and Delirium window.</p>
			<p>Defensively, <DataLink action="THE_BLACKEST_NIGHT"/> is a powerful cooldown that can mitigate heavy damage on you or a target,
				and grants a free use of Edge of Shadow or Flood of Shadow as long as the shield is fully consumed.</p>
		</Trans>
	</>,

	supportedPatches: {
		from: '7.0',
		to: '7.0',
	},

	contributors: [
		{user: CONTRIBUTORS.AZARIAH, role: ROLES.MAINTAINER},
	],

	changelog,
})
