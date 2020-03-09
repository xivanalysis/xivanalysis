import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'

const description = t('smn.about.description')`
This analyser aims to identify some of the low-hanging fruit that could be used to improve your SMN gameplay, as well as give a deeper insight into what happened during an encounter.

Due to the nature of how SMN plays, there may be a near _overwhelming_ number of suggestions showing up below. Don't fret it, just focus on one or two improvements at a time.

If you would like to learn more about SMN, check the guides over at [The Balance](https://thebalanceffxiv.com/), and have a chat in the #smn_questions channel.
`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-smn" */),

	Description: () => <>
		<TransMarkdown source={description} key="smn.about.description"/>
		<Message warning icon key="smn.about.description.warning">
			<Icon name="warning sign" key="smn.about.description.warning.icon"/>
			<Message.Content key="smn.about.description.warning.content">
				<Trans id="smn.about.description.warning">While the analysis below should be reasonably accurate, this system is still in development, and may get a little mixed up sometimes. If you notice any issues, or have any concerns, please drop by our Discord channel!</Trans>
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '5.1',
		to: '5.2',
	},
	contributors: [
		{user: CONTRIBUTORS.ACKWELL, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.NEMEKH, role: ROLES.THEORYCRAFT},
		{user: CONTRIBUTORS.FRYTE, role: ROLES.THEORYCRAFT},
		{user: CONTRIBUTORS.KELOS, role: ROLES.DEVELOPER},
	],

	changelog: [{
		date: new Date('2020-02-16'),
		Changes: () => <>Updated DoT tables to separate applications by target and show which skill was used.</>,
		contributors: [CONTRIBUTORS.KELOS],
	}, {
		date: new Date('2020-02-12'),
		Changes: () => <>Added checks for Tri-disaster usage.</>,
		contributors: [CONTRIBUTORS.KELOS],
	}, {
		date: new Date('2019-11-8'),
		Changes: () => <>Updated Ruin 2 suggestions to account for 5.1 changes and marked supported for 5.1.</>,
		contributors: [CONTRIBUTORS.KELOS],
	}, {
		date: new Date('2019-10-31'),
		Changes: () => <>Added Aetherpact to tracked cooldowns and implemented 5.1 changes.</>,
		contributors: [CONTRIBUTORS.KELOS],
	}, {
		date: new Date('2019-10-28'),
		Changes: () => <>Fix duplicate demi-summon entries by adding a brief buffer to pet simulation re-sync when swapping pets and demis.</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	}, {
		date: new Date('2019-08-23'),
		Changes: () => <>Prevent raising weaving issues for triple weaving with <ActionLink {...ACTIONS.FIREBIRD_TRANCE}/></>,
		contributors: [CONTRIBUTORS.ACKWELL],
	}, {
		date: new Date('2019-08-16'),
		Changes: () => <>Implemented Shadowbringers changes.</>,
		contributors: [CONTRIBUTORS.KELOS],
	}],
})
