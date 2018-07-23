import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'

export default class About extends CoreAbout {
	description = <Fragment>
		<p>This analyser aims to identify some of the low-hanging fruit that could be used to improve your SMN gameplay, as well as give a deeper insight into what happened during an encounter.</p>
		<p>Due to the nature of how SMN plays, there may be a near <em>overwhelming</em> number of suggestions showing up below. Don't fret it, just focus on one or two improvements at a time.</p>
		<p>If you would like to learn more about SMN, check the guides over at <a href="https://thebalanceffxiv.com/">The Balance</a>, and have a chat in the <code>#smn_questions</code> channel.</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				While the analysis below should be reasonably accurate, this system <em>is</em> still in development, and may get a little mixed up sometimes. If you notice any issues, or have any concerns, please drop by our Discord channel!
			</Message.Content>
		</Message>
	</Fragment>
	supportedPatch = '4.35'
	contributors = [
		{user: CONTRIBUTORS.ACKWELL, role: 'Maintainer'},
		{user: CONTRIBUTORS.NEMEKH, role: 'Theorycraft'},
		{user: CONTRIBUTORS.FRYTE, role: 'Theorycraft'},
	]
}
