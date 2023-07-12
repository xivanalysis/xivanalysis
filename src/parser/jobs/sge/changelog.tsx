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
		Changes: () => <>Added suggestions for not overcapping Addersgall and Addersting gauges</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-12-20'),
		Changes: () => <>Added cooldown tracking for Phlegma III and the non-Addersgall healing and mitigation cooldowns</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-12-28'),
		Changes: () => <>Added tracking for Tincture and Zoe usage, and marked as supported for Endwalker</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-12-29'),
		Changes: () => <>Refine overheal categories, and fix a bug in the DoT clipping calculation</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2022-01-04'),
		Changes: () => <>Mark as supported for 6.05.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2022-01-15'),
		Changes: () => <>Fixed an issue with Addersting stacks not counting correctly on some logs in 6.05+</>,
		contributors: [CONTRIBUTORS.AZARIAH],
	},
	{
		date: new Date('2022-04-12'),
		Changes: () => <>Updated Addersting gauge initialization for 6.1 and later logs, and cleaned up a few suggestions.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2022-08-27'),
		Changes: () => <>Added data for new shield status from Holos.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2022-09-30'),
		Changes: () => <>Ignore Addersgall actions in Overheal and updated Overheal buckets.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2023-01-15'),
		Changes: () => <>Updates for 6.3: 40 second Phlegma cooldown and Addersting generation for Eukrasian Prognosis on self.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
