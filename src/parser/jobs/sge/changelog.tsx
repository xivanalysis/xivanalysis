import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	// {
	// 	date: new Date('2020-04-20'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2021-11-27'),
		Changes: () => <>Preliminary gauge state and overheal tracking</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-12-15'),
		Changes: () => <>Added DoT, Interrupts, and Swiftcast analysis for Sage</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-12-20'),
		Changes: () => <>Added cooldown tracking for Phlegma III and the non-Addersgall healing and mitigation cooldowns</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-12-27'),
		Changes: () => <>Added tracking for Tincture and Zoe usage, and marked as supported for Endwalker</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
