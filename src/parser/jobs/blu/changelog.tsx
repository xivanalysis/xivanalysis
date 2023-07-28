import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2023-07-24'),
		Changes: () => <>
			<ul>
				<li>BLU's Moon Flute report has been updated for the 6.45 spells. </li>
				<li>BLU's Moon Flute report now handles the Breath of Magic odd-minute reapply burst. </li>
			</ul>
		</>,
		contributors: [CONTRIBUTORS.HUGMEIR],
	},
	{
		date: new Date('2023-07-24'),
		Changes: () => <>
			<ul>
				<li>BLU's cooldowns will filter out spells that were not used at all.</li>
				<li>BLU's cooldowns now track Being Mortal, Sea Shanty, and Winged Reprobation.</li>
			</ul>
		</>,
		contributors: [CONTRIBUTORS.HUGMEIR],
	},
	{
		date: new Date('2023-07-22'),
		Changes: () => <>BLU DoT tracking now handles Breath of Magic & Mortal Flame, and gives suggestions if they are cast unbuffed</>,
		contributors: [CONTRIBUTORS.HUGMEIR],
	},
	{
		date: new Date('2023-07-22'),
		Changes: () => <>BLU now counts the Apokalypsis channel as uptime, and gives a suggestion if channel ticks were dropped.</>,
		contributors: [CONTRIBUTORS.HUGMEIR],
	},
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
