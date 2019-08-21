import React from 'react'

import CONTRIBUTORS from 'data/CONTRIBUTORS'

export const changelog = [
	{
		date: new Date('2019-07-02'),
		Changes: () => <>
			Initial pass through support for Gunbreaker.
		</>,
		contributors: [CONTRIBUTORS.LHEA],
	},
	{
		date: new Date('2019-08-20'),
		Changes: () => <>
			Added usage tracking for No Mercy and Bloodfest.
		</>,
		contributors: [CONTRIBUTORS.QAPHLA],
	},
	// {
	// 	date: new Date('2020-04-20'),
	// 	Changes: () => <>The changes you made</>,
	// 	contrubutors: [CONTRIBUTORS.YOU],
	// },
]
