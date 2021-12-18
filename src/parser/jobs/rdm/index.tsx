import {Trans} from '@lingui/react'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

export const RED_MAGE = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-rdm" */),

	Description: () => <>
		<Trans id="rdm.about.description">
			<p>This analyzer aims to give you the information you need to turn your <span className="text-success">parses</span> into <span className="text-orange">parses</span></p>
			<p>If you would like to learn more about RDM, check the guides over at <a href="https://thebalanceffxiv.com/">The Balance</a>, and have a chat in the <code>#rdm_questions</code> channel.</p>
		</Trans>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="rdm.about.description.warning">Openers are currently not supported at this time.</Trans>
			</Message.Content>
		</Message>
	</>,
	// supportedPatches: {
	// 	from: '6.0',
	// 	to: '6.0',
	// },
	contributors: [
		{user: CONTRIBUTORS.MYPS, role: ROLES.DEVELOPER},
	],

	changelog: [
		{
			date: new Date('2021-12-15'),
			Changes: () => <>Initial Endwalker data update.</>,
			contributors: [CONTRIBUTORS.MYPS],
		},
		{
			date: new Date('2021-12-16'),
			Changes: () => <>Initial Endwalker module updates: gauge update, melee combo update, adding Corps-a-corps/Engegement/Displacement to CooldownDowntime.</>,
			contributors: [CONTRIBUTORS.MYPS],
		},
		{
			date: new Date('2021-12-17'),
			Changes: () => <>Logic for Acceleration to affect cast times.</>,
			contributors: [CONTRIBUTORS.MYPS],
		},
	],
})
