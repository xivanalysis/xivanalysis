import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'

export default {
	modules: () => import('./modules' /* webpackChunkName: "jobs-pld" */),

	description: <Fragment>
		<p>As the illegitimate child of a WHM and BLM, you chose the Gory Path of a shield lobing, sword swinging Mage, that also tries to help everybody out.</p>
		<p>This analyzer attempts to find just the right things to get you to be a fearsome Tank, that will show no <ActionLink {...ACTIONS.CLEMENCY}/> to his enemies, while being the true <ActionLink {...ACTIONS.HOLY_SPIRIT}/> of the Party.</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<p><b>Here be Dragons!</b></p>
				<div>This Analyzer is still <b>Work in Progress</b> and is missing a lot of features as well as simplifying a couple of things for now.</div>
				<div>Make sure to take the advice still with a grain of Salt.</div>
				<div>If you notice any issues, have concerns or suggestions, please drop by our Discord channel!</div>
			</Message.Content>
		</Message>
	</Fragment>,
	supportedPatches: {
		from: '4.2',
		to: '4.4',
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
					<li>Adjustments to Goring blade breakpoint, and</li>
					<li>Tweaks to cooldown ordering in the timeline.</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.MIKEMATRIX],
		},
	],
}
