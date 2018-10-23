import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'

import CONTRIBUTORS from 'data/CONTRIBUTORS'

export default {
	modules: () => import('./modules' /*webpackChunkName: "jobs-ast" */),

	description: <Fragment>
		<p>The biggest <ActionLink {...ACTIONS.DRAW} /> to an Astrologian is their ability to buff their party DPS with Arcanum.
		This analyzer will show you how the stars can and should work for you and not the other way around</p>
		<p>Playing any healer requires you to carefully manage your MP and cooldowns to efficiently
		keep your party alive. If you plan out your heals and communicate with your co-healer, you will naturally end
		up putting out more DPS with the extra GCDs gained.
		</p>
		<p>
			This tool displays the usual uptime and gcd recommendations. It also gives a simple print-out
			for buffs you've extended and the card actions you've made.
		</p>
		<p>Coming soon: Healing analysis. There will be some suggestions based on the decisions made with cards. </p>
		<Message warning icon>
			<Icon name="warning sign" />
			<Message.Content>
				There's still lots more work to be done for this tool to be comprehensive! If you have a suggestion for what is worth tracking
				please pop by our Discord channel!
			</Message.Content>
		</Message>
		<Message warning icon>
			<Icon name="warning sign" />
			<Message.Content>
				Currently, for all healers, boss invulnerability checking doesn't function properly. This results in inaccuracy for many time-related functions such as the Always be casting checklist item or DoT uptime.
			</Message.Content>
		</Message>
	</Fragment>,
	supportedPatches: {
		from: '4.3',
		to: '4.4',
	},
	contributors: [
		{user: CONTRIBUTORS.SUSHIROU, role: 'Maintainer'},
	],
}
