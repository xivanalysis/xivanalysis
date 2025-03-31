import {DataLink} from 'components/ui/DbLink'
import {CONTRIBUTORS} from 'data/CONTRIBUTORS'

export const changelog = [
	{
		date: new Date('2025-03-24'),
		Changes: () => <>GNB 7.2 Support added.</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2024-11-14'),
		Changes: () => <>GNB 7.1 Support added.</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2024-07-24'),
		Changes: () => <> Updated Cooldown offsets for the updated 2.4X and 2.5 Openers and added allowed downtime to <DataLink action="BLOODFEST"/> to allow it to be delayed back under <DataLink action="NO_MERCY"/>.</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
	{
		date: new Date('2024-07-04'),
		Changes: () => <>Initial 7.0 GNB Support</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
]
