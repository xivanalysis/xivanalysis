import {Trans, i18nMark} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import TransMarkdown from 'components/ui/TransMarkdown'
import ACTIONS from 'data/ACTIONS'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import STATUSES from 'data/STATUSES'

const description = `
This analyser aims to identify some of the low-hanging fruit that could be used to improve your SMN gameplay, as well as give a deeper insight into what happened during an encounter.

Due to the nature of how SMN plays, there may be a near _overwhelming_ number of suggestions showing up below. Don't fret it, just focus on one or two improvements at a time.

If you would like to learn more about SMN, check the guides over at [The Balance](https://thebalanceffxiv.com/), and have a chat in the \`#smn_questions\` channel.
`

export default {
	modules: () => import('./modules' /* webpackChunkName: "jobs-smn" */),

	description: <>
		<TransMarkdown id={i18nMark('smn.about.description')} source={description} key="smn.about.description"/>
		<Message warning icon key="smn.about.description.warning">
			<Icon name="warning sign" key="smn.about.description.warning.icon"/>
			<Message.Content key="smn.about.description.warning.content">
				<Trans id="smn.about.description.warning">While the analysis below should be reasonably accurate, this system is still in development, and may get a little mixed up sometimes. If you notice any issues, or have any concerns, please drop by our Discord channel!</Trans>
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '4.2',
		to: '4.5',
	},
	contributors: [
		{user: CONTRIBUTORS.ACKWELL, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.NEMEKH, role: ROLES.THEORYCRAFT},
		{user: CONTRIBUTORS.FRYTE, role: ROLES.THEORYCRAFT},
	],

	changelog: [{
		date: new Date('2018-11-21'),
		changes: <>
			A few small tweaks and adjustments:&nbsp;
			<ul>
				<li>Prevented <ActionLink {...ACTIONS.DEATHFLARE}/>s lost due to death from counting towards lost-deathflare suggestion.</li>
				<li>Adjusted <StatusLink {...STATUSES.SHADOW_FLARE}/> uptime calculation to  exclude time before the first cast.</li>
			</ul>
		</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	}],
}
