import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2021-11-22'),
		contributors: [CONTRIBUTORS.RYAN],
		Changes: () => <>
			Converted Ammo to Core Gauge and added a Aoe checker for bad uses of Demon Slice and Fated Circle.
		</>,
	},
	{
		date: new Date('2021-04-28'),
		contributors: [CONTRIBUTORS.RYAN],
		Changes: () => <>
			Expanded No Mercy table to include the optimal amount of burst strikes based on bloodfest use
		</>,
	},

	{
		date: new Date('2021-04-26'),
		contributors: [CONTRIBUTORS.YUMIYAFANGIRL],
		Changes: () => <>
		Added a module that shows Tincture windows.
		</>,
	},
	{
		date: new Date('2021-04-13'),
		contributors: [CONTRIBUTORS.ACCHAN],
		Changes: () => <>
			Mark patch 5.5 supported.
		</>,
	},
	{
		date: new Date('2020-12-08'),
		Changes: () => <>
			Mark patch 5.4 supported.
		</>,
		contributors: [CONTRIBUTORS.ACCHAN],
	},
	{
		date: new Date('2019-07-02'),
		Changes: () => <>
			Initial pass through support for Gunbreaker.
		</>,
		contributors: [CONTRIBUTORS.LHEA],
	},
	{
		date: new Date('2019-08-20'),
		Changes: () => <>
			Added usage tracking for No Mercy and Bloodfest.
		</>,
		contributors: [CONTRIBUTORS.QAPHLA],
	},
	{
		date: new Date('2020-03-07'),
		Changes: () => <>
			Updated GNB to 5.2 as there have been no changes to
			GNB since 5.08 in terms of gameplay
		</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2020-03-09'),
		Changes: () => <>
			Updated GNB's Feedback and backend logic.
			<ul>
				<li> Added offsets to all ogcds based on the longest possible opener </li>
				<li> Adjusted Blasting Zone to account for either zone based on the level of the player </li>
				<li> Added leftover ammo feedback </li>
			</ul>
		</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2020-04-23'),
		Changes: () => <>
			Expanded feedback on Gnashing Fang combos that do not
			contain the expected 6 actions.
		</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2020-07-09'),
		Changes: () => <>
			Sonic Break has been added to cooldown tracker.
		</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2020-08-11'),
		Changes: () => <>Brutal Shell duration changes and added support for patch 5.3</>,
		contributors: [CONTRIBUTORS.CADENCE],
	},

	// {
	// 	date: new Date('2020-04-20'),
	// 	Changes: () => <>The changes you made</>,
	// 	contrubutors: [CONTRIBUTORS.YOU],
	// },
]
