import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contrubutors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2021-11-04'),
		Changes: () => <>Initial data scaffolding, updated proc handling, and add AoE vs. single-target checks for revised proc actions.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-11-27'),
		Changes: () => <>Updated Esprit gauge generation simulation.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
