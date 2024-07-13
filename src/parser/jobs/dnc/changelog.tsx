import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2024-07-11'),
		Changes: () => <>Add expected actions evaluation for Technical Finish windows, warn against using lower potency combo and proc actions, and mark as supported for Dawntrail</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-07'),
		Changes: () => <>Update Esprit Gauge tracking to handle consumption by Dance of the Dawn, and generation by Tillana</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-06-27'),
		Changes: () => <>Initial data scaffolding for Dawntrail</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
