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
		date: new Date('2024-07-19'),
		Changes: () => <>Update suggestion to avoid using <DataLink action="FIRE_I" />, add evaluation for the usage of <DataLink status="FIRESTARTER" />, and mark as supported for Dawntrial.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-13'),
		Changes: () => <>Update the suggestion for skipping <DataLink action="HIGH_THUNDER" /> before a downtime since it can no longer be hardcast.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-13'),
		Changes: () => <>Update expected fire spell counting to account for Dawntrail's rotation changes, and add a suggestion to use all <DataLink action="FLARE_STAR" />s generated.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-11'),
		Changes: () => <>Initial Rotation Outliers updates to remove defunct errors, and handle <DataLink action="MANAFONT" />'s full reset behavior</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-10'),
		Changes: () => <>Update DoT and proc tracking for Dawntrail thunder system</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-09'),
		Changes: () => <>Update AoE usage tracking for new spells and potencies</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-07'),
		Changes: () => <>Updated gauge state tracking for Dawntrail</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-06-27'),
		Changes: () => <>Add new actions and statuses, remove deleted actions and statuses, and some minimal cleanup to keep modules compiling</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
