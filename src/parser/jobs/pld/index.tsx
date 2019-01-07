import {i18nMark} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import TransMarkdown from 'components/ui/TransMarkdown'
import ACTIONS from 'data/ACTIONS'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

const description = `As the illegitimate child of a WHM and BLM, you chose the Gory Path of a shield lobing, sword swinging Mage, that also tries to help everybody out.

This analyzer attempts to find just the right things to get you to be a fearsome Tank, that will show no [~action/CLEMENCY] to his enemies, while being the true [~action/HOLY_SPIRIT] of the Party.
`

const descriptionWarning = `
**Here be Dragons**

This Analyzer is still **Work in Progress** and is missing a lot of features as well as simplifying a couple of things for now.

Make sure to take the advice still with a grain of Salt.

If you notice any issues, have concerns or suggestions, please drop by our Discord channel!
`

export default {
	modules: () => import('./modules' /* webpackChunkName: "jobs-pld" */),

	description: <>
		<TransMarkdown id={i18nMark('pld.about.description')} source={description} key="pld.about.description"/>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<TransMarkdown id={i18nMark('pld.about.description.warning')} source={descriptionWarning} key="'pld.about.description.warning'"/>
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '4.2',
		to: '4.5',
	},
	contributors: [
		{user: CONTRIBUTORS.MIKEMATRIX, role: ROLES.MAINTAINER},
	],

	changelog: [
		{
			date: new Date('2018-12-09'),
			changes: <>
				<strong>Support for patch 4.4.</strong> Includes:
				<ul>
					<li>Uptime checks for <ActionLink {...ACTIONS.SPIRITS_WITHIN}/> and <ActionLink {...ACTIONS.CIRCLE_OF_SCORN}/>,</li>
					<li>Added support for tracking <ActionLink {...ACTIONS.SWORD_OATH}/> uptime,</li>
					<li>Display failed <ActionLink {...ACTIONS.REQUIESCAT}/> buffs,</li>
					<li>Support for tracking combo issues,</li>
					<li>Adjustments to Goring blade breakpoint, and</li>
					<li>Tweaks to cooldown ordering in the timeline.</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.MIKEMATRIX],
		},
	],
}
