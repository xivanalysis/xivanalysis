import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'
import {ChangelogEntry} from './Meta'

export const changelog: ChangelogEntry[] = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2021-12-31'),
		Changes: () => <>Changed the lowest GCD that the weaving module allows to double-weave under from 2000 ms to 1800 ms.</>,
		contributors: [CONTRIBUTORS.FURST],
	},
	{
		date: new Date('2021-12-16'),
		Changes: () => <>Added Arcane Circle, Radiant Finale, and Searing Light raid buffs to the timeline.</>,
		contributors: [CONTRIBUTORS.HINT],
	},

]
