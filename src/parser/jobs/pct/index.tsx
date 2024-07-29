import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

const description = t('pct.about.description')`
Don't know your oils from your acrylics? Your stamps from your brushes? Do you want to Hammer out a series of brilliant Portraits?

This page will help you find your Muse, so you can Inspire the rest of your party with your artwork!
`

export const PICTOMANCER = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-pct" */),

	Description: () => <>
		<TransMarkdown source={description}/>
	</>,

	supportedPatches: {
		from: '7.0',
		to: '7.01',
	},

	contributors: [
		// {user: CONTRIBUTORS.YOU, role: ROLES.YOUR_ROLE},

		{user: CONTRIBUTORS.AKAIRYU, role: ROLES.DEVELOPER},
	],

	changelog,
})
