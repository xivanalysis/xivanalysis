import {Trans} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'

export default {
	modules: () => import('./modules' /* webpackChunkName: "jobs-drg" */),
	description: <>
		<Trans id="drg.about.description"><p>This analyzer aims to help you beat the sterotypes, stay off the floor, and dish out some big juicy numbers. As the DRG rotation is pretty strict, the suggestions you see will focus mostly on keeping that rotation flowing smoothly, as well as picking out issues related to your Life of the Dragon windows.</p></Trans>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="drg.about.description.warning"><strong>The module is a work in progress.</strong> It currently covers very few aspects of DRG gameplay, and while the analysis below should be reasonably accurate, this system <em>is</em> still in development, and may get a little mixed up sometimes. If you notice any issues, or have any concerns, please drop by our Discord channel or report a bug on our github repository!</Trans>
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '4.05',
		to: '4.4',
	},
	contributors: [
		{user: CONTRIBUTORS.TOASTDEIB, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.ASTRALEAH, role: ROLES.THEORYCRAFT},
	],
	changelog: [],
}
