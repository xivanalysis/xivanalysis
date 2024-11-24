import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2024-11-14'),
		Changes: () => <>Esuna to instant cast, no other usecase changes</>,
		contributors: [CONTRIBUTORS.MERCWRI],
	},
	{
		date: new Date('2024-07-28'),
		Changes: () => <>Initial support for 7.0: Refactor overhealing; overcapping fairy gauge is a always a minor warning now.</>,
		contributors: [CONTRIBUTORS.NONO],
	},
	{
		date: new Date('2024-07-13'),
		Changes: () => <>Add Impact Imminent proc tracking</>,
		contributors: [CONTRIBUTORS.NONO],
	},
	{
		date: new Date('2024-07-13'),
		Changes: () => <>Basic update for Dawntrail Abilities</>,
		contributors: [CONTRIBUTORS.MERCWRI],
	},
]
