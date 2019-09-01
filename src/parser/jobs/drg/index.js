import {Trans} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-drg" */),
	Description: () => <>
		<Trans id="drg.about.description"><p>This analyzer aims to help you beat the sterotypes, stay off the floor, and dish out some big juicy numbers. As the DRG rotation is pretty strict, the suggestions you see will focus mostly on keeping that rotation flowing smoothly, as well as picking out issues related to your Life of the Dragon windows.</p></Trans>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="drg.about.description.warning"><strong>The module is a work in progress.</strong> It currently covers very few aspects of DRG gameplay, and while the analysis below should be reasonably accurate, this system <em>is</em> still in development, and may get a little mixed up sometimes. If you notice any issues, or have any concerns, please drop by our Discord channel or report a bug on our github repository!</Trans>
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '5.0',
		to: '5.08',
	},
	contributors: [
		{user: CONTRIBUTORS.TOASTDEIB, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.ASTRALEAH, role: ROLES.THEORYCRAFT},
	],
	changelog: [{
		date: new Date('2019-07-21'),
		Changes: () => <>Updated Lance Charge/Dragon Sight window analysis logic, made some small text and data corrections.</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	},
	{
		date: new Date('2019-07-07'),
		Changes: () => <>Updated combos to properly account for Raiden Thrust, fixed the Disembowel checklist item.</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	},
	{
		date: new Date('2019-07-05'),
		Changes: () => <>
			Initial changes for Shadowbringers:&nbsp;
			<ul>
				<li>Updated the Blood of the Dragon simulation to account for trait changes</li>
				<li>Temporarily disabled the Rotation Watchdog module until it's updated</li>
				<li>Removed outdated modules</li>
			</ul>
		</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	}],
})
