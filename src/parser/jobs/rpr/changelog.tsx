import {DataLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2021-01-14'),
		Changes: () => <>Add checks for Enshroud and Arcane Circle windows.</>,
		contributors: [CONTRIBUTORS.KELOS],
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
