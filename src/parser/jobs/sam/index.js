import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

const samDescript = t('sam.about.description')`So you study the blade do you? Well consider this analysis the exam to see exactly how much you have learned about the basics of Samurai. This tool will track your Sen and Kenki gains/uses to see if you are missing possible resources to gain or you have failed to make the most out of what you gained over the course of the fight. Study guides for the exam:

- [Bushido, a PVE Samurai Guide](http://bit.ly/SAM-Guide)

- [Visual Guide to Samurai rotation](https://i.imgur.com/N52Dliz.png)
`

export const SAMURAI = new Meta({
	modules: () => import('./modules' /*webpackChunkName: "jobs-sam" */),

	Description: () => <>
		<TransMarkdown source={samDescript}/>
		<Message>
			<Icon name="info"/>
			<Trans id="sam.about.description.info"><strong>Note</strong> Unfortunately, positionals cannot be tracked at this time, and as such, Kenki values are <em>estimates</em>. Care has been taken to keep them as accurate as possible, however some innacuracies may be present.</Trans>
		</Message>
	</>,

	// supportedPatches: {
	// 	from: '6.0',
	// 	to: '6.0',
	// },

	contributors: [
		{user: CONTRIBUTORS.RYAN, role: ROLES.DEVELOPER},
	],

	changelog: [
		// {
		// 	date: new Date('2021-11-19'),
		// 	Changes: () => <>The changes you made</>,
		// 	contrubutors: [CONTRIBUTORS.YOU],
		// },
		{
			date: new Date('2021-11-19'),
			Changes: () => <>Adjust Buff uptime to use new Fugetsu and Fuka Statuses</>,
			contrubutors: [CONTRIBUTORS.RYAN],
		},
	],
})
