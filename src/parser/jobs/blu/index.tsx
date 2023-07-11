import {t, Trans} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {changelog} from './changelog'

const description = t('blu.about.description')`BLU has wildly different play styles depending on your mimicry. This page will primarily focus on the DPS aspect of the job, so do take the advice with a grain of salt if you are healing or tanking.

Worth also keeping in mind the usual adage that BLU content is won and lost on mechanics, not DPS. Following the suggestions here to optimize your performance will always be welcome, but it should not detract from mechanics. Greeding Phantom Flurry ticks at the expense of your teammates' sanity is not recommended.

If you want further context for the suggestions given here, the [Blue Academy Discord](https://discord.gg/blueacademy) is the primary source for Blue Mage information.`

export const BLUE_MAGE = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-blu" */),
	Description: () => <>
		<TransMarkdown source={description}/>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="blu.about.description.warning">This module was recently extended and we would appreciate feedback!</Trans>
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '6.0',
		to: '6.4',
	},
	contributors: [
		{user: CONTRIBUTORS.HUGMEIR, role: ROLES.DEVELOPER},
	],
	changelog,
})
