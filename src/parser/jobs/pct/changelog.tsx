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
		Changes: () => <>Add a table displaying timestamps when procs were dropped, for better clarity around when those issues occurred.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-19'),
		Changes: () => <>Add analysis for the contents of the <DataLink showIcon={false} action="STARRY_MUSE" /> buff windows.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-17'),
		Changes: () => <>Update Weaving analysis to support the longer-than-normal cast times on Motifs and handle <DataLink showIcon={false} status="INSPIRATION" />'s cast time reduction.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-13'),
		Changes: () => <>Add tracking for, and suggestions to avoid dropping, Pictomancer's procs and the stacking <DataLink showIcon={false} status="HAMMER_TIME" /> and <DataLink showIcon={false} status="HYPERPHANTASIA" /> buffs.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-12'),
		Changes: () => <>Add gauge state tracking for PCT</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-11'),
		Changes: () => <>Add checks for using AoE spells with too few targets</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-07'),
		Changes: () => <>Add <DataLink showIcon={false} action="TEMPERA_GRASSA" /> to Defensives tracking and handle cooldown refunding on shield break from it and <DataLink showIcon={false} action="TEMPERA_COAT" />.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-03'),
		Changes: () => <>Initial data and core module support for PCT</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
