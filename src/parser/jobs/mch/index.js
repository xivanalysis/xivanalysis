import {Trans} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-mch" */),
	Description: () => <>
		<Trans id="mch.about.description">
			<p>BOB! <strong>DO SOMETHING!</strong></p>
			<p>This module aims to help you improve your MCH gameplay by analyzing things that are difficult to spot in raw logs and pointing out ways to keep your rotation tight, keep your tools on cooldown, make your Wildfire windows as strong as possible, and get the most out of the best pet any job has right now.</p>
		</Trans>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="mch.about.description.warning"><strong>The module is a work in progress.</strong> It currently covers very few aspects of MCH gameplay, and while the existing features below should be reasonably accurate, this system <em>is</em> still in development, and may get a little mixed up sometimes. If you notice any issues or have any concerns/feature requests, please drop by our Discord channel or report a bug on our github repository!</Trans>
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '5.0',
		to: '5.08',
	},
	contributors: [
		{user: CONTRIBUTORS.TOASTDEIB, role: ROLES.MAINTAINER},
	],
	changelog: [{
		date: new Date('2019-07-23'),
		Changes: () => <>Added a module for tracking Automaton Queen use.</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	},
	{
		date: new Date('2019-07-16'),
		Changes: () => <>Added a module for tracking Reassemble use.</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	},
	{
		date: new Date('2019-07-11'),
		Changes: () => <>Removed obsolete modules, updated gauge simulation, updated Wildfire and Overheat suggestions, added combo support.</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	}],
})
