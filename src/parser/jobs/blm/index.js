import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import TransMarkdown from 'components/ui/TransMarkdown'
import {Meta} from 'parser/core/Meta'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'

const description = t('blm.about.description')`This analyser aims to identify how you're not actually casting [~action/FIRE_IV] as much as you think you are.`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-blm" */),

	Description: () => <>
		<TransMarkdown source={description}/>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="blm.about.description.warning">This isn&apos;t even remotely done.</Trans>
			</Message.Content>
		</Message>
	</>,
	// supportedPatches: {
	// 	from: '4.2',
	// 	to: '4.5',
	// },
	contributors: [
		{user: CONTRIBUTORS.FURST, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.LAQI, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.AKAIRYU, role: ROLES.DEVELOPER},
	],
	changelog: [
		{
			date: new Date('2019-05-29'),
			Changes: () => <>
				Preliminary 5.0 action entries and gauge updates.
			</>,
			contributors: [CONTRIBUTORS.AKAIRYU],
		},
		{
			date: new Date('2019-07-06'),
			Changes: () => <>
				Post-launch 5.0 action entries data, gauge updates, and rotation adjustments.
			</>,
			//contributors: [CONTRIBUTORS.PAIGE], // leaving this commented-out for now since I don't think Paige has added themselves to the contributor list yet
		},
		{
			date: new Date('2019-07-11'),
			Changes: () => <>
				Initial Shadowbringers support for <ActionLink {...ACTIONS.DESPAIR} /> and <ActionLink {...ACTIONS.THUNDER_III} /> changes.
			</>,
			contributors: [CONTRIBUTORS.AKAIRYU],
		},
	],
})
