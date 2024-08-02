import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2024-07-31'),
		Changes: () => <>Added a new module called Dropped Defensives to track defensives that may not be necessary to use, but to give a timeline of when they can be used based on the prerequisite actions. </>,
		contributors: [CONTRIBUTORS.OTOCEPHALY],
	},
]
