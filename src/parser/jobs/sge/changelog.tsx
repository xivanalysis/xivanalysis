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
		date: new Date('2021-12-18'),
		Changes: () => <>Added suggestions for not overcapping Addersgall and Addersting gauges.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
