import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

//import ACTIONS from 'data/ACTIONS'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'

//import {ActionLink} from 'components/ui/DbLink'

export default {
	modules: () => import('./modules' /*webpackChunkName: "jobs-sam" */),

	description: <Fragment>
		<p> So you study the blade do you? Well consider this analysis the exam to see exactly how much you've learned about the basics of Samurai. This tool will track your sen and kenki gains/uses to see if you are missing possible resources to gain or you have failed to make the most out of what you gained over the course of the fight.</p>
		<p> PLEASE NOTE: At this moment in time all Kenki/Sen calculations are done assuming you hit everything in a combo and the postionals on your finishers. This will be updated later to more accurately track those gains, but today is not that day. </p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<b>The module is still throughly incomplete, this is only the most barebones support for <em>basic</em> analysis of SAM gameplay.</b> And while the existing features below should be reasonably accurate, this system <em>is</em> still in development, and may get a little mixed up sometimes. If you notice any issues, or have any concerns, please drop by our Discord channel or report a bug on our github repository!
			</Message.Content>
		</Message>
	</Fragment>,
	supportedPatches: {
		from: '4.3',
		to: '4.4',
	},
	contributors: [
		{user: CONTRIBUTORS.RYAN, role: ROLES.MAINTAINER},
	],
}
