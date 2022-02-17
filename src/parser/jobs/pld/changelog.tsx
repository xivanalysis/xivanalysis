import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2022-02-16'),
		Changes: () => <>
			Spells under Requiescat now properly instant for weaving purposes.
		</>,
		contributors: [CONTRIBUTORS.ARIA],
	},
	{
		date: new Date('2022-01-12'),
		Changes: () => <>
			Added Jump to Timeline functionality for Goring/BoV table.
		</>,
		contributors: [CONTRIBUTORS.ARIA],
	},
	{
		date: new Date('2021-12-29'),
		Changes: () => <>
			Added support for Endwalker.
		</>,
		contributors: [CONTRIBUTORS.ARIA],
	},
	{
		date: new Date('2021-12-29'),
		Changes: () => <>
			Updated Goring and Valor tracking.
		</>,
		contributors: [CONTRIBUTORS.ARIA],
	},
	{
		date: new Date('2021-12-24'),
		Changes: () => <>
			Updated various buff windows and ability thresholds.
		</>,
		contributors: [CONTRIBUTORS.ARIA],
	},
	{
		date: new Date('2021-12-24'),
		Changes: () => <>
			Updated Tincture module to track Expiacion uses.
		</>,
		contributors: [CONTRIBUTORS.ARIA],
	},
	{
		date: new Date('2021-12-20'),
		Changes: () => <>
			Updated Requiescat module for Endwalker.
		</>,
		contributors: [CONTRIBUTORS.ARIA],
	},
]
