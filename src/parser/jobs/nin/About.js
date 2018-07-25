import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'

export default class About extends CoreAbout {
	description = <Fragment>
		<p>Hey there, NIN friend! Are you tired of being looked down on by your MNK and BLM peers? Wish your raid team would stop using you for your Trick Attacks and appreciate you for who you really are? Well look no further! We&apos;ll help you bring yourself all the way up from <strong><span className="text-grey">this</span></strong> to <strong><span className="text-orange">this</span></strong>*!</p>
		<p>*Results not guaranteed. Offer void where prohibited. Please don&apos;t sue us.</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<b>The module is a work in progress.</b> It could still be tracking a number of additional aspects of NIN gameplay, and while the existing features below should be reasonably accurate, this system <em>is</em> still in development, and may get a little mixed up sometimes. If you notice any issues or have any concerns/feature requests, please drop by our Discord channel or report a bug on our github repository!
			</Message.Content>
		</Message>
	</Fragment>
	supportedPatch = '4.35'
	contributors = [
		{user: CONTRIBUTORS.TOASTDEIB, role: 'Maintainer'},
	]
}
