import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'

export default class About extends CoreAbout {
	description = <Fragment>
		<p>This analyser aims to identify how you're not actually casting <ActionLink {...ACTIONS.FIRE_IV} /> as much as you think you are.</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				This isn&apos;t even remotely done.
			</Message.Content>
		</Message>
	</Fragment>
	supportedPatch = '4.35'
	contributors = [
		{user: CONTRIBUTORS.FURST, role: 'Maintainer'},
		{user: CONTRIBUTORS.LAQI, role: 'Maintainer'},
	]
}
