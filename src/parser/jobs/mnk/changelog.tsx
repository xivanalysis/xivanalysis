import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2022-01-02'),
		Changes: () => <>Migrated Riddle of Fire analyser to BuffWindow.</>,
		contributors: [CONTRIBUTORS.MALP],
	},
	{
		date: new Date('2022-01-01'),
		Changes: () => <>Fix GL speed modifier bug.</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2021-12-19'),
		Changes: () => <>Update basic buffs and cooldown tracking, and add new actions.</>,
		contributors: [CONTRIBUTORS.AY],
	},
]
