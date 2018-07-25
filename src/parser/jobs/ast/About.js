import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'

export default class About extends CoreAbout {
	description = <Fragment>
		<p>This analyser aims to identify some of the low-hanging fruit that could be used to improve your gameplay, as well as (eventually) (hopefully) give deeper insight into optimizing your healing and card usage.</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				There is nothing here yet. For suggestions pop by our Discord channel!
			</Message.Content>
		</Message>
	</Fragment>
	supportedPatch = '4.35'
	contributors = [
	]
}
