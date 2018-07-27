import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'

export default class About extends CoreAbout {
	description = <Fragment>
		<p>This analyzer aims to identify some of the low-hanging fruit that could be used to improve your WAR gameplay, as well as give a deeper insight into what happened during an encounter.</p>
		<p>While it's currently fairly incomplete, you can always axe questions in the Discord server, and if you need to learn how to WAR, you can always check out <a href="http://thebalanceffxiv.com">The Balance</a>.</p>
		<p>Any bugs, complaints, suggestions -- Join us on the XivA Discord, and ping me (Sayaka) to let me know.</p>

		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<b>The module is still throughly incomplete, this is only the most barebones support for <em>basic</em> analysis of WAR gameplay.</b> And while the existing features below should be reasonably accurate, this system <em>is</em> still in development, and may get a little mixed up sometimes. If you notice any issues, or have any concerns, please drop by our Discord channel!
			</Message.Content>
		</Message>
	</Fragment>
	supportedPatch = '4.35'
	contributors = [
		{user: CONTRIBUTORS.SAYAKA, role: 'Maintainer'},
	]
}
