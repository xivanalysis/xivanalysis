import React from 'react'

import CONTRIBUTORS from 'data/CONTRIBUTORS'

export const changelog = [
	{
		date: new Date('2020-02-08'),
		Changes: () => <>
			Added BLU Weaving module to reduce false positives.
		</>,
		contributors: [CONTRIBUTORS.PAIGE_404],
	},
	{
		date: new Date('2020-02-01'),
		Changes: () => <>
			Adjusted several GCD actions to fix Always Be Casting estimations.
		</>,
		contributors: [CONTRIBUTORS.PAIGE_404],
	},
	{
		date: new Date('2019-12-30'),
		Changes: () => <>
			Added this changelog.
		</>,
		contributors: [CONTRIBUTORS.PAIGE_404],
	},
]
