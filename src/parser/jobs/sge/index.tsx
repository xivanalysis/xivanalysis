import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

const description = t('sge.about.description')`
You can write the description for the job here. It supports a superset of
[markdown](https://commonmark.org/).
`

export const SAGE = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-sge" */),

	Description: () => <TransMarkdown source={description}/>,
	// supportedPatches: {
	// 	from: '✖',
	// 	to: '✖',
	// }
	contributors: [
		// {user: CONTRIBUTORS.YOU, role: ROLES.MAINTAINER},
	],

	changelog,
})
