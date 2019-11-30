import {t} from '@lingui/macro'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

const description = t('mnk.about.description')`
Hello friendly monk! Do you not Crit the Boot? Does your Six-Sided Star dream remain a meme?

This monk analyser should help you realise your true potential and ensure no party will let a Samurai steal your loot ever again!
`

const warning = t('mnk.about.description.warning')`
**The module is still a work in progress** and may occasionally give you bad feedback.
If you notice any issues, or have any questions or feedback, please drop by our Discord channel!
`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-mnk" */),

	Description: () => <>
		<TransMarkdown source={description} key="mnk.about.description" />
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<TransMarkdown source={warning} key="mnk.about.description.warning" />
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '5.0',
		to: '5.1',
	},

	contributors: [
		{user: CONTRIBUTORS.ACCHAN, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.LHEA, role: ROLES.DEVELOPER},
	],
	changelog: [
		{
			date: new Date('2019-11-20'),
			Changes: () => <>
				Mark MNK supported for Shadowbringers.
			</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2019-11-16'),
			Changes: () => <>
				Added support for Riddle of Fire window analysis.
			</>,
			contributors: [CONTRIBUTORS.LHEA, CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2019-11-16'),
			Changes: () => <>
				Updated AoE module to handle new skills and switch to core AoE module and lose my awesome variable names.
			</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2019-10-26'),
			Changes: () => <>
				Migrated to the core Gauge module.
			</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2019-10-15'),
			Changes: () => <>
				Added a new module to handle Riddle of Earth usage.
			</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2019-09-08'),
			Changes: () => <>
				Added support for Perfect Balance windows.
			</>,
			contributors: [CONTRIBUTORS.LHEA],
		},
		{
			date: new Date('2019-09-03'),
			Changes: () => <>
				Updated Twin Snakes module to account for 5.0 refresh management and rotational changes.
			</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2019-09-03'),
			Changes: () => <>
				Updated Forms for 5.05-5.08 changes.
			</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2019-08-22'),
			Changes: () => <>
				Added new module for 5.0 Dragon Kick and Bootshine.
			</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
	],
})
