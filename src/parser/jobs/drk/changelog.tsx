import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2024-08-02'),
		Changes: () => <>Fixed Bloodspiller adjustment for expected uses during a potion window in the opener</>,
		contributors: [CONTRIBUTORS.AZARIAH],
	},
	{
		date: new Date('2024-07-29'),
		Changes: () => <>Fixed incorrect Blood Weapon stacks and Living Shadow no longer costs blood to use</>,
		contributors: [CONTRIBUTORS.AZARIAH],
	},
	{
		date: new Date('2024-07-07'),
		Changes: () => <>Initial Dawntrail support for Dark Knight</>,
		contributors: [CONTRIBUTORS.AZARIAH],
	},
]
