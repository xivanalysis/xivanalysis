import React from 'react'
import {Label} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

export const changelog = [
	{
		date: new Date('2019-07-28'),
		Changes: () => <>
			Big <ActionLink showIcon={false} {...ACTIONS.PITCH_PERFECT}/> module update: Added checking for windows where there might have been stacks of <ActionLink showIcon={false} {...ACTIONS.PITCH_PERFECT}/> that went unused.
	<Label color="orange" size="tiny" horizontal pointing="right">NOTE:</Label>We do not know how many unused stacks you have at the end of <ActionLink showIcon={false} {...ACTIONS.THE_WANDERERS_MINUET}/>. This is just a guess where if there were two DoT ticks left after the last use of <ActionLink showIcon={false} {...ACTIONS.PITCH_PERFECT}/> before the end of <ActionLink showIcon={false} {...ACTIONS.THE_WANDERERS_MINUET}/> that is not during downtime, we point it out.
	Added tracking lost potency from each mistake, Added timeline buttons. Removed the remaining references to repertoire proccing off of DoT crits
	</>,
		contributors: [CONTRIBUTORS.RIRIAN],
	},
	{
		date: new Date('2019-07-24'),
		Changes: () => <>
		Added a new <ActionLink {...ACTIONS.SIDEWINDER}/> and <ActionLink {...ACTIONS.SHADOWBITE}/> module that will
		let you know when you cast either of them on a target that doesn't have both <StatusLink {...STATUSES.CAUSTIC_BITE}/> and <StatusLink {...STATUSES.STORMBITE}/> applied.
		It will also let you know when you cast {ACTIONS.SHADOWBITE.name} on only one target.
		</>,
		contributors: [CONTRIBUTORS.RIRIAN],
	},
	{
		date: new Date('2019-07-22'),
		Changes: () => <>
			Fixed cases where if <ActionLink {...ACTIONS.RAGING_STRIKES}/> was cast pre-pull, the OGCD tracker would fail to recognized it was cast.
		</>,
		contributors: [CONTRIBUTORS.RIRIAN],
	},
]
