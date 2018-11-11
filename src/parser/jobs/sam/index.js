import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'

export default {
	modules: () => import('./modules' /*webpackChunkName: "jobs-sam" */),

	description: <>
		<p>So you study the blade do you? Well consider this analysis the exam to see exactly how much you've learned about the basics of Samurai. This tool will track your sen and kenki gains/uses to see if you are missing possible resources to gain or you have failed to make the most out of what you gained over the course of the fight.</p>
		<Message
			info icon="info"
			content={<><strong>Note</strong> Unfortunately, positionals cannot be tracked at this time, and as such, Kenki values are <em>estimates</em>. Care has been taken to keep them as accurate as possible, however some innacuracies may be present.</>}
		/>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<strong>The module is incomplete, and only supports <em>basic</em> analysis of SAM gameplay.</strong> While the existing features below should be reasonably accurate, this system <em>is</em> still in development, and may get a little mixed up sometimes. If you notice any issues, or have any concerns, please drop by our Discord channel or report a bug on our github repository!
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '4.3',
		to: '4.4',
	},
	contributors: [
		{user: CONTRIBUTORS.RYAN, role: ROLES.MAINTAINER},
	],

	changelog: [
		{
			date: new Date('2018-11-04'),
			changes: <>Added tracking and suggestions for combos, sen, and emulated kenki. Also a kenki graph. I like graphs.</>,
			contributors: [CONTRIBUTORS.ACKWELL],
		},
	],
}
