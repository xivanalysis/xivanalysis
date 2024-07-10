import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2024-07-09'),
		Changes: () => <>Update AoE usage tracking for new spells and potencies</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
		date: new Date('2024-07-07'),
		Changes: () => <>Updated gauge state tracking for Dawntrail</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-06-27'),
		Changes: () => <>Add new actions and statuses, remove deleted actions and statuses, and some minimal cleanup to keep modules compiling</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
