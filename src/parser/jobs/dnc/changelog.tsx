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
		date: new Date('2022-01-04'),
		Changes: () => <>Mark as supported for 6.05.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2022-01-17'),
		Changes: () => <>Removed Step drift suggestions that duplicated cooldown checklist feedback.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2022-01-25'),
		Changes: () => <>Update AoE checks for Windmill and mark supported for 6.08.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2022-02-16'),
		Changes: () => <>Improved accuracy of Esprit gauge generation simulation.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2022-04-13'),
		Changes: () => <>Update proc analysis to handle the separate Flourish and combo-sourced procs.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2022-09-08'),
		Changes: () => <>Fix a bug preventing missed steps from registering as an error.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2022-09-30'),
		Changes: () => <>Fix a bug that could improperly mark Quadruple Technical Finish as wrong if Technical Step was started before the pull.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2023-01-15'),
		Changes: () => <>Fix a bug where fights with unavoidable downtime could report Standard Step uptime as a negative percentage.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2023-05-27'),
		Changes: () => <>Adjust Devilment timing check to account for changed Technical Finish status application timing after 6.4.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
