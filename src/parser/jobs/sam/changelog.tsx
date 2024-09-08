import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2024-08-03'),
		Changes: () => <>7.05 support added. pre-7.05 support removed </>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2024-07-21'),
		Changes: () => <>7.01 support bump, Tendo recasts adjusted </>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2024-07-02'),
		Changes: () => <>Initial 7.0 SAM Support</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
]
