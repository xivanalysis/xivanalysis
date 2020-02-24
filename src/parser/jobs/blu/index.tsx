import {t, Trans} from '@lingui/macro'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import {changelog} from './changelog'

const description = t('blu.about.description')`This is a limited analyzer for a limited job. It's not ready yet, but please look forward to it.

This analyzer will focus on DoTs, uptime, and proper usage of [~action/BRISTLE],[~action/MOON_FLUTE], and [~action/SURPANAKHA].
`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-blu" */),
	Description: () => <>
		<TransMarkdown source={description}/>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="blu.about.description.warning">This module is under development and not yet ready for the public.</Trans>
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '✖', // TODO: Update when we have even the most basic gcd uptime working
		to: '✖',
	},
	contributors: [
		{user: CONTRIBUTORS.PAIGE_404, role: ROLES.DEVELOPER},
	],
	changelog,
})
