import {DataLink} from 'components/ui/DbLink'
import {CONTRIBUTORS} from 'data/CONTRIBUTORS'

export const changelog = [
	{
		date: new Date('2025-03-24'),
		Changes: () => <>SAM 7.2 Support added. <DataLink action="HISSATSU_GUREN"/> breakpoint increased to 3 from 2.</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2025-01-19'),
		Changes: () => <>Fixed the spelling of <DataLink action="TENGENTSU"/>.</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2024-11-14'),
		Changes: () => <>SAM updated for 7.1 Support</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2024-10-20'),
		Changes: () => <>Fixed an issue where the resource timeline did not reflect Meditation stacks gained from <DataLink action="TENDO_GOKEN"/> and <DataLink action="TENDO_SETSUGEKKA"/>. </>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2024-09-08'),
		Changes: () => <>Updated <DataLink action="HAGAKURE"/> feedback to no longer suggest using it during a fight</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2024-08-03'),
		Changes: () => <>7.05 support added. pre-7.05 support removed </>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2024-07-21'),
		Changes: () => <>7.01 support bump, Tendo recasts adjusted </>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2024-07-02'),
		Changes: () => <>Initial 7.0 SAM Support</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
]
