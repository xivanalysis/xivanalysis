import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2024-08-23'),
		Changes: () => <>Fix Philosophia overheal ignoring to correctly attribute its healing to the Eudaimonia status effect</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-10'),
		Changes: () => <>Update Defensives and Tincture tracking, and mark as supported for Dawntrail</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-10'),
		Changes: () => <>Exclude Philosophia healing from overheal tracking, similar to Kardia</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-09'),
		Changes: () => <>Add Eukrasian Prognosis II to list of heals affected by Zoe</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-07'),
		Changes: () => <>Add Psyche to cooldowns checklist, and enforce timeline ordering for Psyche and Philosophia</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-06-27'),
		Changes: () => <>Initial data scaffolding for Dawntrail</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
