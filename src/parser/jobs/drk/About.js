import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'

export default class About extends CoreAbout {
  description = <Fragment>
  	<p>This analyzer focuses on blood and mana usage, and then further explores common resource generation problems such as Blood Weapon up-time and dropping GCDs.</p>
  	<Message warning icon>
	  <Icon name="warning sign"/>
	  <Message.Content>
		Heavily a work in progress. Complaints, concerns, and issues should be directed to the discord server.
	  </Message.Content>
  	</Message>
  </Fragment>
  supportedPatch = '4.35'
  contributors = [
  	{user: CONTRIBUTORS.ACRI, role: 'Maintainer'},
  ]
}
