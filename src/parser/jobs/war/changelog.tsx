import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2024-08-04'),
		Changes: () => <>Add tincture module</>,
		contributors: [CONTRIBUTORS.KWEREY],
	},
	{
		date: new Date('2024-08-03'),
		Changes: () => <>Bump supported patch, no other changes</>,
		contributors: [CONTRIBUTORS.KWEREY],
	},
	{
		date: new Date('2024-07-19'),
		Changes: () => <>Add support for new Dawntrail job actions</>,
		contributors: [CONTRIBUTORS.KWEREY],
	},
]
