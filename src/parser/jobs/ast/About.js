import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'

import CONTRIBUTORS from 'data/CONTRIBUTORS'

import CoreAbout from 'parser/core/modules/About'

export default class About extends CoreAbout {
	description = <Fragment>
		<p>The biggest <ActionLink {...ACTIONS.DRAW} /> to an Astrologian is their ability to buff their party DPS with Arcanum.
		This analyzer will show you how the stars can and should work for you and not the other way around</p>
		<p>Playing any healer requires you to carefully manage your MP and cooldowns to efficiently
		keep your party alive. If you plan out your heals and communicate with your co-healer, you will naturally end
		up putting out more DPS with the extra GCDs gained.
		</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				There is really nothing truly AST specific here yet. If you have a suggestion of what is worth tracking
				please pop by our Discord channel!
			</Message.Content>
		</Message>
		<p>Currently: This tool displays the usual uptime and gcd recommendations. It also gives a simple print-out
			for buffs you've extended.<br/>
			Coming soon: Arcana usage and uptime analysis, healing analysis. More detail on buff extension hopefully.</p>

		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
			Currently, for all healers, boss invulnerability checking doesn't function properly. This results in inaccuracy for many time-related functions such as the Always be casting checklist item or DoT uptime.
			</Message.Content>
		</Message>
	</Fragment>
	supportedPatches = {
		from: '4.3',
		to: '4.36',
	}
	contributors = [
		{user: CONTRIBUTORS.SUSHIROU, role: 'Maintainer'},
	]
}
