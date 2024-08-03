import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2024-08-02'),
		Changes: () => <>Added Dokumori to the raid buffs list on the timeline.</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	},
	{
		date: new Date('2024-07-17'),
		Changes: () => <>Added a module for tracking dropped Phantom Kamaitachi Ready and Tenri Jindo Ready procs.</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	},
	{
		date: new Date('2024-07-12'),
		Changes: () => <>Fixed a bug with Kunai's Bane not always registering the last attack in a window.</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	},
	{
		date: new Date('2024-07-12'),
		Changes: () => <>Updated Kazematoi suggestion tiers.</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	},
	{
		date: new Date('2024-06-10'),
		Changes: () => <>Initial NIN support for Dawntrail.</>,
		contributors: [CONTRIBUTORS.TOASTDEIB],
	},
]
