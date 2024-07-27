import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

const description = t('pct.about.description')`
`

export const PICTOMANCER = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-pct" */),

	Description: () => <>
		<TransMarkdown source={description}/>
	</>,

	supportedPatches: {
		from: '✖',
		to: '✖',
	},

	contributors: [
		// {user: CONTRIBUTORS.YOU, role: ROLES.YOUR_ROLE},

		{user: CONTRIBUTORS.AKAIRYU, role: ROLES.DEVELOPER},
	],

	changelog,
})
