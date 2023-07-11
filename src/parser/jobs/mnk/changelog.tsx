import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2023-07-02'),
		Changes: () => <>Add 6.3 Riddle of Earth changes.</>,
		contributors: [CONTRIBUTORS.HINT],
	},
	{
		date: new Date('2023-02-18'),
		Changes: () => <>Add Timeline support for low level actions.</>,
		contributors: [CONTRIBUTORS.HINT],
	},
	{
		date: new Date('2022-07-25'),
		Changes: () => <>Add Riddle of Wind to Riddle of Fire window.</>,
		contributors: [CONTRIBUTORS.FAIR2DARE],
	},
	{
		date: new Date('2022-05-03'),
		Changes: () => <>Add expected Masterful Blitz support in Riddle of Fire window.</>,
		contributors: [CONTRIBUTORS.SQUARE],
	},
	{
		date: new Date('2022-04-29'),
		Changes: () => <>Adjust Riddle of Wind expected count for windows that get the max possible.</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2022-04-28'),
		Changes: () => <>Add Brotherhood support.</>,
		contributors: [CONTRIBUTORS.SQUARE],
	},
	{
		date: new Date('2022-03-03'),
		Changes: () => <>Add Celestial Revolution support.</>,
		contributors: [CONTRIBUTORS.SQUARE],
	},
	{
		date: new Date('2022-02-20'),
		Changes: () => <>Add Riddle of Wind statistic.</>,
		contributors: [CONTRIBUTORS.MALP],
	},
	{
		date: new Date('2022-02-14'),
		Changes: () => <>Fix incorrect combo resets bug when Dragon Kick is spammed.</>,
		contributors: [CONTRIBUTORS.MALP],
	},
	{
		date: new Date('2022-02-10'),
		Changes: () => <>Add Masterful Blitz statistics.</>,
		contributors: [CONTRIBUTORS.MALP],
	},
	{
		date: new Date('2022-02-10'),
		Changes: () => <>Cleanup Riddle of Fire module.</>,
		contributors: [CONTRIBUTORS.MALP],
	},
	{
		date: new Date('2022-01-13'),
		Changes: () => <>Migrate Riddle of Fire module to BuffWindow.</>,
		contributors: [CONTRIBUTORS.MALP],
	},
	{
		date: new Date('2022-01-03'),
		Changes: () => <>Update Twin Snakes buff description, and adjust timeline order.</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2022-01-01'),
		Changes: () => <>Fix GL speed modifier bug.</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2021-12-19'),
		Changes: () => <>Update basic buffs and cooldown tracking, and add new actions.</>,
		contributors: [CONTRIBUTORS.AY],
	},
]
