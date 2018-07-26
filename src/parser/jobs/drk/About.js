import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'

export default class About extends CoreAbout {
  description = <Fragment>
	<p>This analyzer focuses on blood and mana usage.</p>
	<Message warning icon>
	  <Icon name="warning sign"/>
	  <Message.Content>
		This module focuses on assisting with Mana/Blood capping and Blood Weapon up-time, as well as general fundamentals of DRK gameplay.  Drop by the discord for any clarifications and corrections.
	  </Message.Content>
	</Message>
  </Fragment>
  supportedPatch = '4.35'
  contributors = [
	{user: CONTRIBUTORS.ACRI, role: 'Maintainer'},
  ]
}
