import React from 'react'
import {Icon, Message} from 'semantic-ui-react'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Trans} from '@lingui/react'
import {Meta} from 'parser/core/Meta'

export default new Meta({
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
	supportedPatches: {
		from: '5.1',
		to: '5.2',
	},
	contributors: [
		{user: CONTRIBUTORS.LEYLIA, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.JUMP, role: ROLES.THEORYCRAFT},
		{user: CONTRIBUTORS.AZARIAH, role: ROLES.DEVELOPER},
	],

	changelog: [
		{
			date: new Date('2020-05-05'),
			Changes: () => <>Adjusted Combo Severity when you aren't 80|80 going in to always be major.  Fixed a typo; added the Tincture module.</>,
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2020-02-27'),
			Changes: () => <>Added Verstone and Verfire procs to the Timeline</>,
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2020-02-26'),
			Changes: () => <>Bump up supported version to 5.2</>,
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2020-01-02'),
			Changes: () => <>Adjusted Cooldown Downtime handling based on 3-8 Standard opener</>,
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2019-11-03'),
			Changes: () => <>Added basic support for 5.1.  Resolved issue with manafication overcap statistic</>,
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2019-08-12'),
			Changes: () => <>Added handling for Displacement/engagement and Corps-a-corps related to manafication.  Removed manafication from overcap suggestion, added it as 2 small statistics.</>,
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2019-08-05'),
			Changes: () => <>Removed Lucid Dream from oGCD checklist, Displacement now takes Engagement into consideration in the oGCD checklist</>,
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2019-07-30'),
			Changes: () => <>Reprise Cost updated, resolved negative mana issue in Gauge tracking</>,
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2019-07-26'),
			Changes: () => <>Fix an issue with Moulinet Mana costs</>,
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2019-07-14'),
			Changes: () => <>Initial update of existing logic for 5.0 (no new stuff)</>,
			contributors: [CONTRIBUTORS.LEYLIA],
		},
	],
})
