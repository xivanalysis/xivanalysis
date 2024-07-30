import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2024-07-22'),
		Changes: () => <>Added tracking for unused Divine Caress procs</>,
		contributors: [CONTRIBUTORS.INNI],
	},
	{
		date: new Date('2024-07-27'),
		Changes: () => <>Updated Tinctures section (Glare IV + Multiple Dia)</>,
		contributors: [CONTRIBUTORS.NICOLAS],
	},
	{
		date: new Date('2024-07-30'),
		Changes: () => <>Added tracking for unused Glare IV procs</>,
		contributors: [CONTRIBUTORS.INNI],
	},
]
