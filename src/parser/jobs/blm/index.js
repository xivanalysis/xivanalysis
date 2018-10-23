import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {i18nMark, Trans} from '@lingui/react'
import TransMarkdown from 'components/ui/TransMarkdown'

const description = 'This analyser aims to identify how you\'re not actually casting [~action/FIRE_IV] as much as you think you are.'

export default {
	modules: () => import('./modules' /* webpackChunkName: "jobs-blm" */),

	description: <Fragment>
		<TransMarkdown id={i18nMark('blm.about.description')} source={description}/>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="blm.about.description.warning">This isn&apos;t even remotely done.</Trans>
			</Message.Content>
		</Message>
	</Fragment>,
	supportedPatches: {
		from: '4.2',
		to: '4.4',
	},
	contributors: [
		{user: CONTRIBUTORS.FURST, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.LAQI, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.AKAIRYU, role: ROLES.DEVELOPER},
	],
}
