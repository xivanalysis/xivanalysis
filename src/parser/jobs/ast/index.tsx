import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {changelog} from './changelog'

const description = t('ast.about.description-2')`
Playing any healer requires you to carefully manage your MP and cooldowns to efficiently keep your party alive. If you plan out your heals and communicate with your co-healer, you will naturally end up putting out more DPS with the extra GCDs gained.
`

export const ASTROLOGIAN = new Meta({
	modules: () => import('./modules' /*webpackChunkName: "jobs-ast" */),

	Description: () =><>
		<p><Trans id="ast.about.description-1">The biggest draw to an Astrologian is their ability to buff their party DPS with Arcanum.
		This analyzer will show you how the stars work for you and not the other way around</Trans></p>
		<TransMarkdown source={description} key="ast.about.description-2"/>
		<Message warning icon>
			<Icon name="warning sign" />
			<Message.Content>
				<Trans id="ast.about.description.warning.development">
				There's still lots more work to be done for this tool to be comprehensive! If you have a suggestion for what is worth tracking
				please pop by our Discord channel!</Trans>
			</Message.Content>
		</Message>
	</>,

	supportedPatches: {
		from: '✖',
		to: '✖',
	},

	contributors: [
		{user: CONTRIBUTORS.SUSHIROU, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.OTOCEPHALY, role: ROLES.DEVELOPER},
	],

	changelog,
})
