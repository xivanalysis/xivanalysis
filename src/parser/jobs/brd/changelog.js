import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import ACTIONS from 'data/ACTIONS'

export const changelog = [
	{
		date: new Date('2019-07-22'),
		Changes: () => <>
			Fixed cases where if <ActionLink {...ACTIONS.RAGING_STRIKES}/> was cast pre-pull, the OGCD tracker would fail to recognized it was cast.
		</>,
		contributors: [CONTRIBUTORS.RIRIAN],
	},
]
