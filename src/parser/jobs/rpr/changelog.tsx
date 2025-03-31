import {DataLink} from 'components/ui/DbLink'
import {CONTRIBUTORS} from 'data/CONTRIBUTORS'

export const changelog = [
	{
		date: new Date('2025-03-24'),
		Changes: () => <>Reaper 7.2 Support added. <DataLink action = "EXECUTIONERS_GUILLOTINE" /> breakpoint increased from 3 to 4. <DataLink action = "SPINNING_SCYTHE"/> breakpoint increased from 3 to 4.</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2024-11-14'),
		Changes: () => <> Reaper 7.1 Support added</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2024-10-20'),
		Changes: () => <>Fixed Harpe & Harvest Moon not generating gauge.</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2024-10-8'),
		Changes: () => <>Initial Dawntrail support for Reaper added.</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
]
