import {DataLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2024-08-03'),
		Changes: () => <>Add a table displaying timestamps when procs were dropped or overwritten, for better clarity around when those issues occurred.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-23'),
		Changes: () => <>Add an informational Tinctures module.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-14'),
		Changes: () => <>Fix a bug in the logic that allows a single Last Dance if no GCD weaker than Saber Dance is used under Technical Finish</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-13'),
		Changes: () => <>Add shared cooldown support for <DataLink action="STANDARD_STEP" /> and <DataLink action="FINISHING_MOVE" /></>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
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
