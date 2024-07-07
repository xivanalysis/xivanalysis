//import {DataLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'
import {ChangelogEntry} from './Meta'

export const changelog: ChangelogEntry[] = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2024-07-03'),
		Changes: () => <>Update core support for the Dawntrail expansion</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
