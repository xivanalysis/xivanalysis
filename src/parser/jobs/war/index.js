import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

const description = t('war.about.description')`This analyzer aims to identify some of the low-hanging fruit that could be used to improve your WAR gameplay, as well as give a deeper insight into what happened during an encounter.
It's currently fairly feature complete, with minimal additions needed. If you need to learn how to WAR, you can always check out [The Balance](https://thebalanceffxiv.com/).
Any bugs, complaints, suggestions -- Join us on the XivA Discord, and ping me (SKYE#6666) to let me know.`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-war" */),

	Description: () => <>
		<TransMarkdown source={description} />
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="war.about.description.warning">While the analysis below should be reasonably accurate, this system is still in development, and may get a little mixed up sometimes. If you notice any issues, or have any concerns, please drop by our Discord channel.</Trans>
			</Message.Content>
		</Message>
	</>,
	// supportedPatches: {
	// 	from: '4.2',
	// 	to: '4.5',
	// },
	contributors: [
		{user: CONTRIBUTORS.SKYE, role: ROLES.MAINTAINER},
	],

	changelog: [{
		date: new Date('2019-07-30'),
		contributors: [CONTRIBUTORS.SKYE],
		Changes: () => <>
			Initial changes for Shadowbringers:
			<ul>
				<li>Updated the Inner Release module to account for Inner Chaos and Chaotic Cyclone</li>
				<li>Changed the Storms Eye Module buffer to 7 seconds instead of the old 10 seconds</li>
				<li>Changed the Gauge module to track the Infuriate reduction through Inner Chaos and Chaotic Cyclone instead of Fell Cleave and Decimate</li>
			</ul>
		</>,
	}],
})
