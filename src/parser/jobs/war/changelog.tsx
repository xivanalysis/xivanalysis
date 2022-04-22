import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2022-04-12'),
		Changes: () => <>
			Add pre-6.1 Inner Release and Beast gauge handling for the reduced set of stack consumers.
		</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2022-01-22'),
		Changes: () => <>
			Add Nascent Chaos status timeout/overwrite tracking.
		</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2022-01-01'),
		Changes: () => <>
			Fix bugged Inner Release rushed window handling in suggestions.
		</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2021-12-03'),
		Changes: () => <>
			Add support for Endwalker.
		</>,
		contributors: [CONTRIBUTORS.AY],
	},
]
