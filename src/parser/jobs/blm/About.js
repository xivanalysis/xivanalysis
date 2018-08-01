import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'
//import {i18nMark, Trans} from '@lingui/react'

export default class About extends CoreAbout {

	//static i18n_id = i18nMark('blm.about.title')
	description = <Fragment>
		<p>This analyser aims to identify how you're not actually casting <ActionLink {...ACTIONS.FIRE_IV} /> as much as you think you are.</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				This isn&apos;t even remotely done.
			</Message.Content>
		</Message>
	</Fragment>
	supportedPatch = '4.35'
	contributors = [
		{user: CONTRIBUTORS.FURST, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.LAQI, role: ROLES.MAINTAINER},
	]
}
