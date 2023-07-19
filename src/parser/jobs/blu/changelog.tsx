import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2023-07-22'),
		Changes: () => <>Winged Reprobation's cooldown will be displayed correctly in the timeline.</>,
		contributors: [CONTRIBUTORS.HUGMEIR],
	},
	{
		date: new Date('2023-07-20'),
		Changes: () => <>Added BLU's new 6.45 spells & effects.</>,
		contributors: [CONTRIBUTORS.HUGMEIR],
	},
	{
		date: new Date('2023-07-12'),
		Changes: () => <>
			<ul>
				<li>Dying to Final Sting and Self-Destruct won't be counted as a death. </li>
				<li>Moon Flute windows with a Final Sting have no requirements. </li>
			</ul>
		</>,
		contributors: [CONTRIBUTORS.HUGMEIR],
	},
	{
		date: new Date('2023-05-14'),
		Changes: () => <>BLU's Overheal report no longer counts Devour as a heal</>,
		contributors: [CONTRIBUTORS.HUGMEIR],
	},
	{
		date: new Date('2023-05-08'),
		Changes: () => <>Support for BLU for 6.0 - 6.4</>,
		contributors: [CONTRIBUTORS.HUGMEIR],
	},
]
