import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {ActionLink} from 'components/ui/DbLink'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import ACTIONS from 'data/ACTIONS'

export default {
	modules: () => import('./modules' /* webpackChunkName: "jobs-brd" */),

	description: <Fragment>
		<p>Welcome to the Bard module! Despite being a very straightforward job, Bard's complexity is deceiving.</p>
		<p>Considered by many as an <i>"easy to learn, hard to master"</i> job, Bard is a job that relies heavily on decision-making.</p>
		<p>Improvements on Bard can range from the fundamentals of properly utilizing songs (<ActionLink {...ACTIONS.THE_WANDERERS_MINUET}/>, <ActionLink {...ACTIONS.MAGES_BALLAD}/> and <ActionLink {...ACTIONS.ARMYS_PAEON}/>) up to the intricacies of <ActionLink {...ACTIONS.IRON_JAWS}/> and the concept of buff/debuff snapshotting.</p>
		<p>This analyzer will guide you through the job's core mechanics, all the way to encounter-specific optimization.</p>

		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				This module is still in its early stages. Various functionalities are still missing or changing constantly. If you think something is clearly broken, head to our Discord server and reach out to any of the contributors!
			</Message.Content>
		</Message>
	</Fragment>,
	supportedPatches: {
		from: '4.06',
		to: '4.4',
	},
	contributors: [
		{user: CONTRIBUTORS.YUMIYA, role: ROLES.DEVELOPER},
	],
}
