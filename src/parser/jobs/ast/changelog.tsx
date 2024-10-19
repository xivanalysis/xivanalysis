import {DataLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2024-08-24'),
		Changes: () => <>Added <DataLink action={'LIGHTSPEED'} /> and <DataLink action={'SWIFTCAST'} /> to defensives. </>,
		contributors: [CONTRIBUTORS.OTOCEPHALY],
	},
	{
		date: new Date('2024-07-31'),
		Changes: () => <>Added a new module called Dropped Defensives to track defensives that may not be necessary to use, but to give a timeline of when they can be used based on the prerequisite actions. </>,
		contributors: [CONTRIBUTORS.OTOCEPHALY],
	},
	{
		date: new Date('2024-07-11'),
		Changes: () => <>Updated actions, statuses, timeline, checklist, tincture, divination modules to work with 7.0 AST based on The Balance guides. </>,
		contributors: [CONTRIBUTORS.OTOCEPHALY],
	},
]
