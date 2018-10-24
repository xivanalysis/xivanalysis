import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {Trans, i18nMark} from '@lingui/react'
import TransMarkdown from 'components/ui/TransMarkdown'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'

const description = `
This analyser aims to identify some of the low-hanging fruit that could be used to improve your WHM gameplay, as well as give a deeper insight into what happened during an encounter.

Note that since healing is a very fight-dependent process, it might be that some suggestions do not apply to you, but they may they help to inform you about things you have missed.

If you would like to learn more about WHM, check the guides over at [The Balance](https://thebalanceffxiv.com/), and have a chat in the \`#whm_questions\` channel.
`

export default {
	modules: () => import('./modules' /* webpackChunkName: "jobs-whm" */),

	description: <Fragment>
		<TransMarkdown id={i18nMark('whm.about.description')} source={description}/>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="whm.about.description.devwarning">The WHM module is still in a very early developement stage.  If you notice any issues, or have any concerns, or suggestions on what you would like this module to analyze next, please drop by our Discord channel!</Trans>
			</Message.Content>
		</Message>
		<Trans id="whm.about.description.support">Currently this module can track DoT uptime, detect clipping and report about missed Divine Benison and Assize casts.</Trans>

		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="whm.about.description.invulnwarning">Currently, for all healers, boss invulnerability checking doesn't function properly. This results in inaccuracy for many time-related functions such as the Always be casting checklist item or DoT uptime.</Trans>
			</Message.Content>
		</Message>
	</Fragment>,
	supportedPatches: {
		from: '4.05',
		to: '4.4',
	},
	contributors: [
		{user: CONTRIBUTORS.VULCWEN, role: ROLES.MAINTAINER},
	],
}
