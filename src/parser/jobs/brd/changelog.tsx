import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2024-08-23'),
		Changes: () => <>Added soul voice and repertoire gauge tracking when gauge information is available.</>,
		contributors: [CONTRIBUTORS.YUMIYA],
	},
	{
		date: new Date('2024-07-28'),
		Changes: () => <>Removed Raging Strikes module and added a Burst Window module.</>,
		contributors: [CONTRIBUTORS.YUMIYA],
	},
]
