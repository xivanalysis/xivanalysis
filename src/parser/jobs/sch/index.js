import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'

export default {
	modules: () => import('./modules' /* webpackChunkName: "jobs-sch" */),

	description: <Fragment>
		<p>This analyser aims to identify some of the low-hanging fruit that could be used to improve your SCH gameplay, as well as give a deeper insight into what happened during an encounter.</p>
		<p>If you would like to learn more about SCH, check the guides over at <a href="https://thebalanceffxiv.com/">The Balance</a>, and have a chat in the <code>#sch_questions</code> channel.</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				While the analysis below should be reasonably accurate, this system <em>is</em> still in development, and may get a little mixed up sometimes. If you notice any issues, or have any concerns, please drop by our Discord channel!
			</Message.Content>
		</Message>

		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
			Currently, for all healers, boss invulnerability checking doesn't function properly. This results in inaccuracy for many time-related functions such as the Always be casting checklist item or DoT uptime.
			</Message.Content>
		</Message>
	</Fragment>,
	supportedPatches: {
		from: '4.3',
		to: '4.4',
	},
	contributors: [
		{user: CONTRIBUTORS.LIMA, role: ROLES.MAINTAINER},
	],
}
