import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

const samDescript = t('sam.about.description')`So you study the blade do you? Well consider this analysis the exam to see exactly how much you have learned about the basics of Samurai. This tool will track your Sen and Kenki gains/uses to see if you are missing possible resources to gain or you have failed to make the most out of what you gained over the course of the fight. Study guides for the exam:

- [Bushido, a PVE Samurai Guide](http://bit.ly/SAM-Guide)

- [Visual Guide to Samurai rotation](https://i.imgur.com/978VOqG.jpg)
`

export const SAMURAI = new Meta({
	modules: () => import('./modules' /*webpackChunkName: "jobs-sam" */),

	Description: () => <>
		<TransMarkdown source={samDescript}/>
	</>,

	supportedPatches: {
		from: '6.0',
		to: '6.45',
	},

	contributors: [
		{user: CONTRIBUTORS.RYAN, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.KALITTLES, role: ROLES.DEVELOPER},
	],

	changelog,
})
