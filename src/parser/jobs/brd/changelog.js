import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

export const changelog = [
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
