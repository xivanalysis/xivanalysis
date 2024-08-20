import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

const samDescript = t('sam.about.description')`So you study the blade do you? Well consider this analysis the exam to see exactly how much you have learned about the basics of Samurai. This tool will track your Sen and Kenki gains/uses to see if you are missing possible resources to gain or you have failed to make the most out of what you gained over the course of the fight.'
`

export const SAMURAI = new Meta({
	modules: () => import('./modules' /*webpackChunkName: "jobs-sam" */),

	Description: () => <>
		<TransMarkdown source={samDescript}/>
	</>,

	supportedPatches: {
		from: '7.05',
		to: '7.05',
	},

	contributors: [
		{user: CONTRIBUTORS.RYAN, role: ROLES.DEVELOPER},
	],

	changelog,
})
