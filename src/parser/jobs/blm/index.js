import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import TransMarkdown from 'components/ui/TransMarkdown'
import {Meta} from 'parser/core/Meta'
import {StatusLink} from 'components/ui/DbLink'
import STATUSES from 'data/STATUSES'

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
	supportedPatches: {
		from: '5.0',
		to: '5.08',
	},
	contributors: [
		{user: CONTRIBUTORS.FURST, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.LAQI, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.AKAIRYU, role: ROLES.DEVELOPER},
	],
	changelog: [{
		date: new Date('2019-07-17'),
		Changes: () => <>Initial Black Mage support for Shadowbringers expansion</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2019-07-18'),
		Changes: () => <>New suggestion for Manafont and cleaned up F4 counts</>,
		contributors: [CONTRIBUTORS.FURST],
	},
	{
		date: new Date('2019-07-20'),
		Changes: () => <>Keep track of, and warn against dropping, <StatusLink {...STATUSES.SHARPCAST} /> buffs.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2019-07-28'),
		Changes: () => <>Significant rework of Rotation Outliers display and related suggestions.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	}],
})
