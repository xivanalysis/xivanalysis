import React from 'react'
import {Icon, Message} from 'semantic-ui-react'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import ACTIONS from 'data/ACTIONS'
import {ActionLink} from 'components/ui/DbLink'
import {Trans} from '@lingui/react'

export default {
	modules: () => import('./modules' /* webpackChunkName: "jobs-rdm" */),

	description: <>
		<Trans id="rdm.about.description">
			<p>This analyzer aims to give you the information you need to turn your <span className="text-success">parses</span> into <span className="text-orange">parses</span></p>
			<p>If you would like to learn more about RDM, check the guides over at <a href="https://thebalanceffxiv.com/">The Balance</a>, and have a chat in the <code>#rdm_questions</code> channel.</p>
		</Trans>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="rdm.about.description.warning">Openers, advanced <ActionLink {...ACTIONS.CORPS_A_CORPS}/>, <ActionLink {...ACTIONS.DISPLACEMENT}/>, and <ActionLink {...ACTIONS.MANAFICATION}/> rules are currently not supported at this time.</Trans>
			</Message.Content>
		</Message>
</>,
	supportedPatches: {
		from: '4.2',
		to: '4.4',
	},
	contributors: [
		{user: CONTRIBUTORS.LEYLIA, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.JUMP, role: ROLES.THEORYCRAFT},
	],

	changelog: [
		{
			date: new Date('2018-07-21'),
			changes: 'Initial release of the Red Mage module.',
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2018-07-22'),
			changes: 'Fixed issues with Manafication overage being lost, issues Scatter in Dualcast, as well as some Invulnerability handling for Dualcast.',
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2018-07-29'),
			changes: 'Added tracking of Cooldown Downtime for oGCDs',
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2018-07-30'),
			changes: 'Added Swiftcast to the list of tracked oGCDs for Cooldown Downtime',
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2018-08-08'),
			changes: 'Initial support for Procs - Impactful, Verfire, Verstone',
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2018-08-09'),
			changes: 'Resolved an issue with the Impactful force cast override not being reset',
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2018-08-16'),
			changes: 'Added localization to Gauge suggestions, resolved some wording with chart, backend cleanup',
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2018-08-18'),
			changes: 'Fixed a bug related to all 3 procs when a boss is invulnerable',
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2018-09-20'),
			changes: 'Initial support for Melee combo and Finishers, added support to Mana changes for Enhanced Scatter for 4.4.',
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2018-10-16'),
			changes: 'Fixed a few text errors, but mostly backend changes',
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2018-10-29'),
			changes: 'Condensed Proc Suggestions, clarified wording, added Trans/Plural support for Localization and added a Listing of what Targets the RDM hit with Proc spells',
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2018-11-05'),
			changes: 'Modified Severity for Wasted/Missed Dualcasts based on feedback',
			contributors: [CONTRIBUTORS.LEYLIA],
		},
		{
			date: new Date('2018-11-06'),
			changes: 'Resolved a number of issues with logs that do not contain one or more procs, and issues with Omega(story) invuln target being unavailable',
			contributors: [CONTRIBUTORS.LEYLIA],
		},
	],
}
