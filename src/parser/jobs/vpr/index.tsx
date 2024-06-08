import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
// import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

const description = t('vpr.about.description')`
`

export const VIPER = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-vpr" */),

	Description: () => <>
		<TransMarkdown source={description}/>
	</>,

	supportedPatches: {
		from: '✖',
		to: '✖',
	},

	contributors: [
	// {user: CONTRIBUTORS.YOU, role: ROLES.YOUR_ROLE},
	],

	changelog,
})
