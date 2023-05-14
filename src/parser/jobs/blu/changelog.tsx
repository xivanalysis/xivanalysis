import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2023-05-14'),
		Changes: () => <>BLU's Overheal report no longer counts Devour as a heal</>,
		contributors: [CONTRIBUTORS.HUGMEIR],
	},
	{
		date: new Date('2023-05-08'),
		Changes: () => <>Support for BLU for 6.0 - 6.4</>,
		contributors: [CONTRIBUTORS.HUGMEIR],
	},
]
