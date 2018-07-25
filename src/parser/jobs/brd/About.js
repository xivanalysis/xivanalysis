import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {ActionLink} from 'components/ui/DbLink'

import CONTRIBUTORS from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'
import ACTIONS from 'data/ACTIONS'

export default class About extends CoreAbout {
	description = <Fragment>
		<p>Welcome to the Bard module! Despite being a very straightforward job, Bard's complexity is deceiving.</p>
		<p>Considered by many as an <i>"easy to learn, hard to master"</i> job, Bard is a job that relies heavily on decision-making.</p>
		<p>Improvements on Bard can range from the fundamentals of properly utilizing songs (<ActionLink {...ACTIONS.THE_WANDERERS_MINUET}/>, <ActionLink {...ACTIONS.MAGES_BALLAD}/> and <ActionLink {...ACTIONS.ARMYS_PAEON}/>) up to the intricacies of <ActionLink {...ACTIONS.IRON_JAWS}/> and the concept of buff/debuff snapshotting.</p>
		<p>This analyzer will guide you through the job's core mechanics, all the way to encounter-specific optimization.</p>

		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				While the analysis below should be reasonably accurate, this system <em>is</em> still in development, and may get a little mixed up sometimes. If you notice any issues, or have any concerns, please drop by our Discord channel!
			</Message.Content>
		</Message>
	</Fragment>
	supportedPatch = '4.35'
	contributors = [
		{user: CONTRIBUTORS.YUMIYA, role: 'Maintainer'},
	]
}
