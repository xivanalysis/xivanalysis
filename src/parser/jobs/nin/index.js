import {Trans} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'

export default {
	modules: () => import('./modules' /* webpackChunkName: "jobs-nin" */),
	description: <>
		<Trans id="nin.about.description">
			<p>Hey there, NIN friend! Are you tired of being looked down on by your MNK and BLM peers? Wish your raid team would stop using you for your Trick Attacks and appreciate you for who you really are? Well look no further! We'll help you bring yourself all the way up from <strong className="text-grey">this</strong> to <strong className="text-orange">this</strong>*!</p>
			<p>As NIN tends to be more fluid than rotational, this module contains mostly suggestions for ways you can improve your gameplay, rather than strict checklist requirements. If you see a lot, don't panic - just tackle them one at a time.</p>
			<p>*Results not guaranteed. Offer void where prohibited. Please don't sue us.</p>
		</Trans>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="nin.about.description.warning">While the existing features below should be reasonably accurate, this system is still in development and may get a little mixed up sometimes. If you notice any issues or have any concerns/feature requests, please drop by our Discord channel or report a bug on our github repository!</Trans>
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '4.1',
		to: '4.4',
	},
	contributors: [
		{user: CONTRIBUTORS.TOASTDEIB, role: ROLES.MAINTAINER},
	],
	changelog: [],
}
