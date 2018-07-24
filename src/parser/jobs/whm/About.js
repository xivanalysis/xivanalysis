import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'

export default class About extends CoreAbout {
	description = <Fragment>
		<p>This analyser aims to identify some of the low-hanging fruit that could be used to improve your WHM gameplay, as well as give a deeper insight into what happened during an encounter.</p>
		<p>If you would like to learn more about WHM, check the guides over at <a href="https://thebalanceffxiv.com/">The Balance</a>, and have a chat in the <code>#whm_questions</code> channel.</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				The WHM module is still in a very early developement stage.  If you notice any issues, or have any concerns, or suggestions on what you would like this module to analyze next, please drop by our Discord channel!
			</Message.Content>
		</Message>
		<p>Currently this module can track DoT uptime, detect clipping and report about missed Divine Benison and Assize casts.</p>
	</Fragment>
	supportedPatch = '4.35'
	contributors = [
		{user: CONTRIBUTORS.VULCWEN, role: 'Developer'},
	]
}
