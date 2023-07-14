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
	{
		date: new Date('2021-12-12'),
		Changes: () => <>Handle Paradox being instant-cast in Umbral Ice.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-12-15'),
		Changes: () => <>Miscellaneous bug fixes, and marking supported for Endwalker.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-12-20'),
		Changes: () => <>Keep track of Manaward and Addle usage.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-12-21'),
		Changes: () => <>Suggestions not to overwrite Sharpcast or Triplecast while the statuses are still active.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-12-24'),
		Changes: () => <>Correct Paradox gauge handling to grant a stack of the active stance, instead of just a timer refresh.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2022-01-04'),
		Changes: () => <>Mark as supported for 6.05.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2022-01-08'),
		Changes: () => <>Mark missed Umbral Ice Paradoxes as a cycle error and update the Rotation Outliers table header copy.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2022-01-10'),
		Changes: () => <>Fixed a bug causing Sharpcasts to appear as if they were consumed by Umbral Ice Paradoxes in the timeline.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2022-03-19'),
		Changes: () => <>Fixed a bug with the Not Casting check that was giving incorrect results for fight downtime and end-of-fight casts.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2023-05-24'),
		Changes: () => <>Foul now requires 3 targets to outperform Xenoglossy due to 6.4 potency increase.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2023-06-05'),
		Changes: () => <>Display timestamps for Paradox and Polyglot overwrites.</>,
		contributors: [CONTRIBUTORS.MALI],
	},
]
