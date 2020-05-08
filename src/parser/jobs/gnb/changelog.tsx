import React from 'react'

import CONTRIBUTORS from 'data/CONTRIBUTORS'

export const changelog = [
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
		date: new Date('2020-4-23'),
		Changes: () => <>
			Expanded feedback on Gnashing Fang combos that do not
			contain the expected 6 actions.
		</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	// {
	// 	date: new Date('2020-04-20'),
	// 	Changes: () => <>The changes you made</>,
	// 	contrubutors: [CONTRIBUTORS.YOU],
	// },
]
