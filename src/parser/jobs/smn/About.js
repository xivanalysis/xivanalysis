import {Trans, i18nMark} from '@lingui/react'
import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'

const description = `
This analyser aims to identify some of the low-hanging fruit that could be used to improve your SMN gameplay, as well as give a deeper insight into what happened during an encounter.

Due to the nature of how SMN plays, there may be a near _overwhelming_ number of suggestions showing up below. Don't fret it, just focus on one or two improvements at a time.

If you would like to learn more about SMN, check the guides over at [The Balance](https://thebalanceffxiv.com/), and have a chat in the \`#smn_questions\` channel.
`

export default class About extends CoreAbout {
	description = <Fragment>
		<TransMarkdown id={i18nMark('smn.about.description')} source={description}/>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="smn.about.description.warning">While the analysis below should be reasonably accurate, this system is still in development, and may get a little mixed up sometimes. If you notice any issues, or have any concerns, please drop by our Discord channel!</Trans>
			</Message.Content>
		</Message>
	</Fragment>
	supportedPatches = {
		from: '4.2',
		to: '4.36',
	}
	contributors = [
		{user: CONTRIBUTORS.ACKWELL, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.NEMEKH, role: ROLES.THEORYCRAFT},
		{user: CONTRIBUTORS.FRYTE, role: ROLES.THEORYCRAFT},
	]
}
