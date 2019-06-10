import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

const description = t('sch.about.description')`
This analyser aims to identify some of the low-hanging fruit that could be used to improve your SCH gameplay, as well as give a deeper insight into what happened during an encounter.

If you would like to learn more about SCH, check the guides over at [The Balance](https://thebalanceffxiv.com/), and have a chat in the #sch_questions channel.
`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-sch" */),

	Description: () => <>
		<TransMarkdown source={description} key="sch.about.description"/>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="sch.about.description.warning.development">While the analysis below should be reasonably accurate, this system <em>is</em> still in development, and may get a little mixed up sometimes. If you notice any issues, or have any concerns, please drop by our Discord channel!</Trans>
			</Message.Content>
		</Message>

		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="sch.about.description.warning.healer">Currently, for all healers, boss invulnerability checking doesn't function properly. This results in inaccuracy for many time-related functions such as the Always be casting checklist item or DoT uptime.</Trans>
			</Message.Content>
		</Message>
	</>,
	// supportedPatches: {
	// 	from: '4.3',
	// 	to: '4.5',
	// },
	contributors: [
		{user: CONTRIBUTORS.LIMA, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.SUSHIROU, role: ROLES.DEVELOPER},
	],
	changelog: [
	],
})
