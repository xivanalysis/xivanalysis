import {DataLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	// {
	// 	date: new Date('2021-12-03'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2021-12-18'),
		Changes: () => <>Add a checklist for <DataLink status="DEATHS_DESIGN"/> uptime.</>,
		contributors: [CONTRIBUTORS.HINT],
	},
]
