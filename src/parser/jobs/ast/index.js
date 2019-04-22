import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'

import TransMarkdown from 'components/ui/TransMarkdown'

import CONTRIBUTORS from 'data/CONTRIBUTORS'

const description = t('ast.about.description-2')`
Playing any healer requires you to carefully manage your MP and cooldowns to efficiently keep your party alive. If you plan out your heals and communicate with your co-healer, you will naturally end up putting out more DPS with the extra GCDs gained.

This tool displays the usual uptime and gcd recommendations. It also gives a simple print-out for buffs you've extended and the card actions you've made.
`

export default {
	modules: () => import('./modules' /*webpackChunkName: "jobs-ast" */),

	description: <Fragment>
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
	</Fragment>,
	supportedPatches: {
		from: '4.3',
		to: '4.5',
	},
	contributors: [
		{user: CONTRIBUTORS.SUSHIROU, role: 'Maintainer'},
	],
	changelog: [
		{
			date: new Date('2019-04-09'),
			changes: 'Added a link in Arcana Logs that will jump to timeline, and a button that jumps back to top. Also made the Minor Arcana icons consistent.',
			contributors: [CONTRIBUTORS.SUSHIROU],
		}],
}
