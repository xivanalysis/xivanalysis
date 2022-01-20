import {DataLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2021-1-19'),
		Changes: () => <>Add tracker for dropped and overwritten <DataLink status="ENHANCED_GIBBET"/> and <DataLink status="ENHANCED_GALLOWS" /> procs</>,
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
