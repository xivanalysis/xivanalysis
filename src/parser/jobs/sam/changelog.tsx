import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contrubutors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2022-02-12'),
		Changes: () => <> Moved Kenki and Meditation Gauge to the Timeline.</>,
		contributors: [CONTRIBUTORS.RYAN],
	}, {
		date: new Date('2022-02-09'),
		Changes: () => <>Fixed a bug that erroneously flagged AoE combos as broken.</>,
		contributors: [CONTRIBUTORS.HINT],
	}, {
		date: new Date('2022-01-28'),
		Changes: () => <>Fixed flawed logic that assumes SAM's can surpass their limits and get more than 3 gcds under the meikyo shisui buff.</>,
		contributors: [CONTRIBUTORS.RYAN],
	}, {
		date: new Date('2022-1-09'),
		Changes: () => <>
			<ul>
				<li>Updated Samurai About to new infographs and removed warning about postionals not being tracked. Mark Samurai as supported</li>
				<li>Higanbana Restored to Analysis.</li>
				<li>Added Kaiten back to the Analysis and added a new suggestion for using Kaiten under Kaiten</li>
				<li>Added Shoha and Ogi to the Analysis.</li>
			</ul>,
		</>,
		contributors: [CONTRIBUTORS.RYAN],
	},	{
		date: new Date('2021-12-31'),
		Changes: () => <>Added Sen and Kenki back to the Analysis. Fixed Fuko not comboing.</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2021-12-28'),
		Changes: () => <>Adjusted Buff uptime to use new Fugetsu and Fuka Statuses</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
]
