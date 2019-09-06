import {t, Trans} from '@lingui/macro'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import {changelog} from './changelog'

const description = t('dnc.about.description')`So, you've become a dancer, but you don't know your Jetes from your Pirouettes? This module will help you learn how to Improvise your way to a standing ovation!

The core parts of dancer are proper performance of your dances, preventing your gauges from overcapping, and using your procs. We'll provide suggestions to help you use these to their best effect.

For further reading, check out these guides:
* [FAQ by Tsuki](https://docs.google.com/document/d/1eNAxyjxvG4u8jEBARCD3FXWUfkK2RgCjEvKSPOUCSOQ/edit?usp=sharing)
* [Write up by Ellunavi](https://docs.google.com/document/d/1iktjQ-kW7Vp-iWy_xEWh6t62FaXqjfGELGmcWOtPQfM/edit?usp=sharing)
`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-dnc" */),

	Description: () => <>
		<TransMarkdown source={description}/>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="dnc.about.description.warning"><strong>The module is a work in progress.</strong><br/>The details of proper DNC gameplay, and the random nature of the gauges, make it difficult to be definitive. If you notice any issues, or have any concerns, please drop by our Discord channel or report a bug on our github repository!</Trans>
			</Message.Content>
		</Message>
	</>,

	supportedPatches: {
		from: '5.0',
		to: '5.08',
	},

	contributors: [
		{user: CONTRIBUTORS.AKAIRYU, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.TWO_BROKEN, role: ROLES.DEVELOPER},
	],

	changelog,
})
