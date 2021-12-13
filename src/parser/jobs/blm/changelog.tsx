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
		Changes: () => <>Initial data scaffolding and basic updates to handle removal of Enochian ability.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-11-27'),
		Changes: () => <>Preliminary updates to gauge state and rotation tracking, including suggestion not to waste Paradoxes.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-11-27'),
		Changes: () => <>Update handling for AoE vs. single-target spells and revise T3 clip timing calculations due to changed status durations.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-11-27'),
		Changes: () => <>Update cooldown tracking checklist to include Amplifier and Sharpcast, drop separate Sharpcast usage statistic, and add handling for Paradox consuming Sharpcast while in Astral Fire.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
