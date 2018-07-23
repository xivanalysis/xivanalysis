import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'

export default class About extends CoreAbout {
	description = <Fragment>
		<p>This analyser aims to identify some of the low-hanging fruit that could be used to improve your BLM gameplay, as well as give a deeper insight into what happened during an encounter.</p>
		<p>If you would like to learn more about BLM, check the guides over at <a href="https://thebalanceffxiv.com/">The Balance</a>, and have a chat in the <code>#blm_questions</code> channel.</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				This isn&apos;t even remotely done.
			</Message.Content>
		</Message>
	</Fragment>
	supportedPatch = '4.35'
	contributors = [
		{user: CONTRIBUTORS.FURST, role: 'Theorycrafter'},
		{user: CONTRIBUTORS.LAQI, role: 'Maintainer'},
	]
}
