import {Trans} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
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
	supportedPatches: {
		from: '5.0',
		to: '5.2',
	},
	contributors: [
		{user: CONTRIBUTORS.ACRI, role: ROLES.THEORYCRAFT},
		{user: CONTRIBUTORS.AZARIAH, role: ROLES.MAINTAINER},
	],
	changelog: [
		{
			date: new Date('2020-04-05'),
			Changes: () => <>Add Esteem actions to Living Shadow timeline group</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2019-07-28'),
			Changes: () => <>Add i18n support</>,
			contributors: [CONTRIBUTORS.AZARIAH],
		},
		{
			date: new Date('2019-07-27'),
			Changes: () => <>Add tracking for Blood Weapon windows</>,
			contributors: [CONTRIBUTORS.AZARIAH],
		},
		{
			date: new Date('2019-07-20'),
			Changes: () => <>Fix issues with gauge calculation and AOE skill tracking</>,
			contributors: [CONTRIBUTORS.AZARIAH],
		},
		{
			date: new Date('2019-07-06'),
			Changes: () => <>Initial release of 5.0 support for Dark Knight</>,
			contributors: [CONTRIBUTORS.AZARIAH],
		},
	],
})
