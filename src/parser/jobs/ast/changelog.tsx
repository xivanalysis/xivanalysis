import {DataLink} from 'components/ui/DbLink'
import {CONTRIBUTORS} from 'data/CONTRIBUTORS'

export const changelog = [
	{
		date: new Date('2025-02-09'),
		Changes: () => <>Added support for AST up to 7.1 including updating the Arcana Logs section. </>,
		contributors: [CONTRIBUTORS.SUSHI, CONTRIBUTORS.OTOCEPHALY],
	},
	{
		date: new Date('2025-02-07'),
		Changes: () => <>Split the direct healing effects of GCDs up from the regen effects they apply, and ignore them if they were applied before the pull or during downtime.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
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
