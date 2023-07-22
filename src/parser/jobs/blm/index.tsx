import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

export const BLACK_MAGE = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-blm" */),

	Description: () => <>
		<Trans id="blm.about.description">This analyser aims to identify how you're not actually casting <DataLink action="FIRE_IV" /> as much as you think you are.</Trans>
	</>,

	supportedPatches: {
		from: '6.0',
		to: '6.45',
	},

	contributors: [
		{user: CONTRIBUTORS.AKAIRYU, role: ROLES.MAINTAINER},
	],

	changelog,
})
