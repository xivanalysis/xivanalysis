import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'

export default {
	modules: () => import('./modules' /* webpackChunkName: "jobs-mnk" */),
	description: <>
		<p>Hello friendly monk! Do you not Crit the Boot? Does your Tornado Kick dream remain a meme?</p>
		<p>This monk analyser should help you realise your true potential and show those pesky Samurai true power!</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<b>The module is still a work in progress</b> and may occasionally give you bad feedback. If you notice any issues, or have any questions or feedback, please drop by our Discord channel!
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '4.2',
		to: '4.4',
	},
	contributors: [
		{user: CONTRIBUTORS.ACCHAN, role: ROLES.MAINTAINER},
	],
	changelog: [],
}
