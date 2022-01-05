import {Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'

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
		from: '6.0',
		to: '6.05',
	},
	contributors: [
		{user: CONTRIBUTORS.AZARIAH, role: ROLES.MAINTAINER},
	],
	changelog: [
		{
			date: new Date('2021-12-18'),
			Changes: () => <>Initial Endwalker support</>,
			contributors: [CONTRIBUTORS.AZARIAH],
		},
		{
			date: new Date('2021-12-18'),
			Changes: () => <>Verify Salt and Darkness used once per Salted Earth and hits targets, update Delirium tracking to handle 3 stacks per use</>,
			contributors: [CONTRIBUTORS.AZARIAH],
		},
		{
			date: new Date('2021-12-13'),
			Changes: () => <>Initial support for new actions, adjust Abyssal Drain to be an AoE alternative for Carve &amp; Spit</>,
			contributors: [CONTRIBUTORS.AZARIAH],
		},
	],
})
