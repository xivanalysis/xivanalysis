import {ActionLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2024-07-25'),
		Changes: () => <>Add suggestions for dropped uses of <ActionLink action="FIRES_REPLY" /> and <ActionLink action="WINDS_REPLY" /></>,
		contributors: [CONTRIBUTORS.HINT],
	},
	{
		date: new Date('2024-07-04'),
		Changes: () => <>Initial data scaffolding for Dawntrail</>,
		contributors: [CONTRIBUTORS.HINT],
	},
]
