import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2024-10-20'),
		Changes: () => <>Fixed Harpe & Harvest Moon not generating gauge.</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2024-10-8'),
		Changes: () => <>Initial Dawntrail support for Reaper added.</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
]
