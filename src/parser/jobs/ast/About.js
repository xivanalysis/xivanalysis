import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
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

		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
			Currently, for all healers, boss invulnerability checking doesn't function properly. This results in inaccuracy for many time-related functions such as the Always be casting checklist item or DoT uptime.
			</Message.Content>
		</Message>
	</Fragment>
	supportedPatch = '4.35'
	contributors = [
	]
}
