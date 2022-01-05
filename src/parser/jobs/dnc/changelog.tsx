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
		Changes: () => <>Removed combo drop leniency around back-to-back Standard/Technical Steps due to lengthened combo timeout.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-11-27'),
		Changes: () => <>Updated Esprit gauge generation simulation.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-12-15'),
		Changes: () => <>Update Devilment timing suggestion, and mark job as supported for Endwalker.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-12-23'),
		Changes: () => <>Bugfix for Technical Finish windows opening due to non-player-controlled units spawning.</>,
		contributors: [CONTRIBUTORS.MYPS],
	},
	{
		date: new Date('2021-12-30'),
		Changes: () => <>Add defensive cooldown checklist for Dancer.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-01-04'),
		Changes: () => <>Mark as supported for 6.05.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
