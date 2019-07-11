import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import TransMarkdown from 'components/ui/TransMarkdown'
import ACTIONS from 'data/ACTIONS'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

const description = t('ast.about.description-2')`
Playing any healer requires you to carefully manage your MP and cooldowns to efficiently keep your party alive. If you plan out your heals and communicate with your co-healer, you will naturally end up putting out more DPS with the extra GCDs gained.
`

export default new Meta({
	modules: () => import('./modules' /*webpackChunkName: "jobs-ast" */),

	Description: () =><>
		<p><Trans id="ast.about.description-1">The biggest <ActionLink {...ACTIONS.DRAW} /> to an Astrologian is their ability to buff their party DPS with Arcanum.
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
		<Message warning icon>
			<Icon name="warning sign" />
			<Message.Content>
				<Trans id="ast.about.description.warning.healer">
				Currently, for all healers, boss invulnerability checking doesn't function properly. This results in inaccuracy for many time-related functions such as the Always be casting checklist item or DoT uptime.
				</Trans>
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '5.0',
		to: '5.0',
	},
	contributors: [
		{user: CONTRIBUTORS.SUSHIROU, role: ROLES.MAINTAINER},
	],
	changelog: [
		{
			date: new Date('2019-07-11'),
			Changes: () => <>
				<strong>Basic support for Shadowbringers</strong>:
				<ul>
					<li>(<ActionLink {...ACTIONS.COMBUST_III} />) DoT update</li>
					<li>(<ActionLink {...ACTIONS.UNDRAW} />) Using it triggers suggestion not to use it</li>
					<li>(<ActionLink {...ACTIONS.LUCID_DREAMING} />, <ActionLink {...ACTIONS.LIGHTSPEED} />) Message update</li>
					<li>(<ActionLink {...ACTIONS.HOROSCOPE} />) Failing to read the cards again triggers suggestion</li>
					<li>(<ActionLink {...ACTIONS.PLAY} />) Coming soon™</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
	],
})
