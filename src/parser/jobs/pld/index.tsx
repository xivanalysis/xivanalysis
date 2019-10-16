import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

const description = t('pld.about.description')`As the illegitimate child of a WHM and BLM, you chose the Gory Path of a shield lobing, sword swinging Mage, that also tries to help everybody out.

This analyzer attempts to find just the right things to get you to be a fearsome Tank, that will show no [~action/CLEMENCY] to his enemies, while being the true [~action/HOLY_SPIRIT] of the Party.
`

const descriptionWarning = t('pld.about.description.warning')`
**Here be Dragons**

This Analyzer is still **Work in Progress** and is missing a lot of features as well as simplifying a couple of things for now.

Make sure to take the advice still with a grain of Salt.

If you notice any issues, have concerns or suggestions, please drop by our Discord channel!
`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-pld" */),

	Description: () => <>
		<TransMarkdown source={description} key="pld.about.description"/>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<TransMarkdown source={descriptionWarning} key="'pld.about.description.warning'"/>
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '5.0',
		to: '5.08',
	},
	contributors: [
		{user: CONTRIBUTORS.MIKEMATRIX, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.LHEA, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.QAPHLA, role: ROLES.DEVELOPER},
	],

	changelog: [
		{
			date: new Date('2019-07-18'),
			Changes: () => <>
				Basic 5.0 support for Paladin.
			</>,
			contributors: [CONTRIBUTORS.LHEA],
		},
		{
			date: new Date('2019-07-23'),
			Changes: () => <>
				Fix penalties for double-weaving during an active Requiescat window.
			</>,
			contributors: [CONTRIBUTORS.LHEA],
		},
		{
			date: new Date('2019-07-25'),
			Changes: () => <>
				Minor fix for weaving case where player leads on oGCDs.
			</>,
			contributors: [CONTRIBUTORS.LHEA],
		},
		{
			date: new Date('2019-08-20'),
			Changes: () => <>
				Added usage tracking for Fight or Flight and Requiescat.
			</>,
			contributors: [CONTRIBUTORS.QAPHLA],
		},
		{
			date: new Date('2019-08-21'),
			Changes: () => <>
				Don't penalize for rushed Requiescat windows due to expected downtime or end-of-fight.
			</>,
			contributors: [CONTRIBUTORS.LHEA],
		},
		{
			date: new Date('2019-09-01'),
			Changes: () => <>
				Don't penalize for rushed Fight or Flight windows due to expected downtime or end-of-fight.
			</>,
			contributors: [CONTRIBUTORS.LHEA],
		},
	],
})
