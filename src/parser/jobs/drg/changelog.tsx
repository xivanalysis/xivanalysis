import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2024-11-14'),
		Changes: () => <>Adjust number of expected uses of Nastrond from 3 to 1 for each buff window. Updated data for patch 7.1.</>,
		contributors: [CONTRIBUTORS.FALINDRITH],
	},
	{
		date: new Date('2024-07-28'),
		Changes: () => <>Enable suggestion output for unused procs.</>,
		contributors: [CONTRIBUTORS.FALINDRITH],
	},
	{
		date: new Date('2024-07-21'),
		Changes: () => <>Added table displaying timeline links to when the Firstminds' Focus gauge was overcapped.</>,
		contributors: [CONTRIBUTORS.FALINDRITH],
	},
	{
		date: new Date('2024-07-09'),
		Changes: () => <>DRG marked as supported for Patch 7.0.</>,
		contributors: [CONTRIBUTORS.FALINDRITH],
	},
	{
		date: new Date('2024-06-28'),
		Changes: () => <>Initial DRG support for Dawntrail.</>,
		contributors: [CONTRIBUTORS.FALINDRITH],
	},
]
