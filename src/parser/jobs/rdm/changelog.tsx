import {CONTRIBUTORS} from 'data/CONTRIBUTORS'

export const changelog = [
	{
		date: new Date('2025-03-24'),
		Changes: () => <>RDM 7.2 Support added.  Modified the Manafication module to allow for AE, Bump for 7.2.</>,
		contributors: [CONTRIBUTORS.LEYLIA],
	},
	{
		date: new Date('2024-08-02'),
		Changes: () => <>Modified the Manafication module to allow for rushing.</>,
		contributors: [CONTRIBUTORS.LEYLIA],
	},
	{
		date: new Date('2024-07-17'),
		Changes: () => <>Fixed issue with Manafication not breaking melee combos</>,
		contributors: [CONTRIBUTORS.LEYLIA, CONTRIBUTORS.AZARIAH],
	},
	{
		date: new Date('2024-07-14'),
		Changes: () => <>Mark Grand Impact as a GCD</>,
		contributors: [CONTRIBUTORS.HUGMEIR],
	},
	{
		date: new Date('2024-07-07'),
		Changes: () => <>Initial Support and Updates for DawnTrail</>,
		contributors: [CONTRIBUTORS.LEYLIA],
	},
]
