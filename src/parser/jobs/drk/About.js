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
		<b>The module is still thoroughly incomplete, this is only the most barebones support for <em>basic</em> analysis of WAR gameplay.</b> And while the existing features below should be reasonably accurate, this system <em>is</em> still in development, and may get a little mixed up sometimes. If you notice any issues, or have any concerns, please drop by our Discord channel!
	  </Message.Content>
	</Message>
  </Fragment>
  supportedPatch = '4.35'
  contributors = [
	{user: CONTRIBUTORS.ACRI, role: 'Maintainer'},
  ]
}
