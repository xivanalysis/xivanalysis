import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CoreAbout from 'parser/core/modules/About'

export default class About extends CoreAbout {
	description = <Fragment>
		<p>Hello friendly monk! Do you not Crit the Boot? Does your Tornado Kick dream remain a meme?</p>
		<p>This monk analyser should help you realise your true potential and show those pesky Samurai true power!</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<b>The module is still a work in progress</b> and may occasionally give you bad feedback. If you notice any issues, or have any questions or feedback, please drop by our Discord channel!
			</Message.Content>
		</Message>
	</Fragment>
	supportedPatch = '4.35'
}
