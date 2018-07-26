import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'

export default class About extends CoreAbout {
	description = <Fragment>
		<p>The AST analyzer currently displays the usual uptime, gcd recommendations. It also prints out a handy chart detailing what buffs you've extended.</p>
		<p>Coming soon: Arcana usage and uptime analysis, healing anaylsis</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				There is really nothing truly AST specific here yet. If you have a suggestion please pop by our Discord channel!
			</Message.Content>
		</Message>
	</Fragment>
	supportedPatch = '4.35'
	contributors = [
		{user: CONTRIBUTORS.SUSHIROU, role: 'Maintainer'},
	]
}
