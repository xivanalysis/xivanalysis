import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2024-07-17'),
		Changes: () => <>Fixed issue with Manafication not breaking melee combos</>,
		contributors: [CONTRIBUTORS.LEYLIA],
	},
	{
		date: new Date('2024-07-07'),
		Changes: () => <>Initial Support and Updates for DawnTrail</>,
		contributors: [CONTRIBUTORS.LEYLIA],
	},
]
