import {DataLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2022-03-11'),
		Changes: () => <>Add Soul Reaver checks.</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2022-02-17'),
		Changes: () => <>Add Enhanced Cross Reaping and Void Reaping to procs.</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2022-02-17'),
		Changes: () => <>Reorder timeline and module navigation.</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2022-02-17'),
		Changes: () => <>Cleanup code to be easier for other developers to work with.</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2022-02-17'),
		Changes: () => <>Fix Death gauge not showing in timeline.</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2022-02-16'),
		Changes: () => <>Allow overriden Arcane Circles to simulate their full duration, and track number of players hit.</>,
		contributors: [CONTRIBUTORS.DEAN],
	},
	{
		date: new Date('2022-02-13'),
		Changes: () => <>Add Soul and Shroud gauge tracking.</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2022-02-12'),
		Changes: () => <>Add Death gauge tracking.</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2022-02-11'),
		Changes: () => <>Add Harvest Moon tracking.</>,
		contributors: [CONTRIBUTORS.ARKEVORKHAT],
	},
	{
		date: new Date('2022-01-29'),
		Changes: () => <>Add usage statistic for defensive cooldowns.</>,
		contributors: [CONTRIBUTORS.HINT],
	},
	{
		date: new Date('2022-01-20'),
		Changes: () => <>Add proc tracking for Enhanced Gibbet and Gallows.</>,
		contributors: [CONTRIBUTORS.ARKEVORKHAT],
	},
	{
		date: new Date('2022-01-14'),
		Changes: () => <>Add checks for Enshroud and Arcane Circle windows.</>,
		contributors: [CONTRIBUTORS.KELOS],
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
