import {t, Trans} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {changelog} from './changelog'

const description = t('dnc.about.description')`So, you've become a dancer, but you don't know your Jetes from your Pirouettes? This module will help you learn how to Improvise your way to a standing ovation!

The core parts of dancer are proper performance of your dances, preventing your gauges from overcapping, and using your procs. We'll provide suggestions to help you use these to their best effect.

If you would like to learn more about dancer, check out the [comprehensive gameplay guide](https://saltedxiv.com/guides/dnc) by Ringabel Dim.
`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-dnc" */),

	Description: () => <>
		<TransMarkdown source={description}/>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="dnc.about.description.warning">Both of dancer's gauges are simulated here, since we don't have exact data available to work from. We've done our best to get it as accurate as we can, and to give you the benefit of the doubt in our suggestions. If you notice anything that looks significantly wrong, please drop by our Discord channel or report a bug on our github repository!</Trans>
			</Message.Content>
		</Message>
	</>,

	supportedPatches: {
		from: '5.0',
		to: '5.5',
	},

	contributors: [
		{user: CONTRIBUTORS.AKAIRYU, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.TWO_BROKEN, role: ROLES.DEVELOPER},
	],

	changelog,
})
