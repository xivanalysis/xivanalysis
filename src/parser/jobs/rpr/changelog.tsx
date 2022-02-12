import {DataLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
<<<<<<< HEAD
		date: new Date('2022-01-22'),
		Changes: () => <>Add Harvest Moon usage tracking. </>,
		contributors: [CONTRIBUTORS.ARKEVORKHAT],
=======
		date: new Date('2021-01-14'),
		Changes: () => <>Add checks for Enshroud and Arcane Circle windows.</>,
		contributors: [CONTRIBUTORS.KELOS],
>>>>>>> upstream/endwalker
	},
	{
		date: new Date('2022-01-20'),
		Changes: () => <>Add proc tracking for Enhanced Gibbet and Gallows.</>,
		contributors: [CONTRIBUTORS.ARKEVORKHAT],
	},
	{
		date: new Date('2021-12-31'),
		Changes: () => <>Add checklist for <DataLink status="IMMORTAL_SACRIFICE"/> consumption.</>,
		contributors: [CONTRIBUTORS.MR_RAZOR],
	},
	{
		date: new Date('2021-12-28'),
		Changes: () => <>Fix Always Be Casting accounting for Soul Slice and Soul Scythe.</>,
		contributors: [CONTRIBUTORS.KELOS],
	},
	{
		date: new Date('2021-12-28'),
		Changes: () => <>Replace Enshroud with Soul Slice and Soul Scythe in Cooldowns checklist.</>,
		contributors: [CONTRIBUTORS.KELOS],
	},
	{
		date: new Date('2021-12-18'),
		Changes: () => <>Add a Tincture module.</>,
		contributors: [CONTRIBUTORS.HINT],
	},
	{
		date: new Date('2021-12-18'),
		Changes: () => <>
			Add a checklist for <DataLink status="DEATHS_DESIGN"/> uptime.
		</>,
		contributors: [CONTRIBUTORS.HINT],
	},
	{
		date: new Date('2021-12-18'),
		Changes: () => <>
			Add basic AoE, combos, weaving, and interrupted casts tracking.
		</>,
		contributors: [CONTRIBUTORS.AY],
	},
]
