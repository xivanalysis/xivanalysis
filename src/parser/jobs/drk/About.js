import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

//import ACTIONS from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'
//import {ActionLink} from 'components/ui/DbLink'

export default class About extends CoreAbout {
	description = <Fragment>
		<p>This analyzer focuses on blood and mana usage, and then further explores common resource generation problems such as Blood Weapon up-time and dropping GCDs.</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				Most of the core content within this analyzer is fully simulated from fflogs data.  If your numbers look weird, be sure to go over the accompanying text, and refer back to the original log.
			</Message.Content>
		</Message>
	</Fragment>
	supportedPatch = '4.35'
	contributors = [
		{user: CONTRIBUTORS.ACRI, role: 'Maintainer'},
	]
}
