import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

const description = t('mnk.about.description')`
Hello friendly monk! Do you not Crit the Boot? Does your Tornado Kick dream remain a meme?

This monk analyser should help you realise your true potential and ensure no party will let a Samurai steal your loot ever again!
`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-mnk" */),

	Description: () => <>
		<TransMarkdown source={description} key="mnk.about.description" />
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="mnk.about.description.warning"><b>The module is still a work in progress</b> and may occasionally give you bad feedback. If you notice any issues, or have any questions or feedback, please drop by our Discord channel!</Trans>
			</Message.Content>
		</Message>
	</>,
	// supportedPatches: {
	// 	from: '4.2',
	// 	to: '4.5',
	// },
	contributors: [
		{user: CONTRIBUTORS.ACCHAN, role: ROLES.MAINTAINER},
	],
	changelog: [],
})
