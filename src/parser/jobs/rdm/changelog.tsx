import {CONTRIBUTORS} from 'data/CONTRIBUTORS'

export const changelog = [
	{
		date: new Date('2026-02-15'),
		Changes: () => <>Modified Overwritten procs suggestion when both procs are available, adjusted tiers so that for now all overwrite proc suggestions will be Minor.</>,
		contributors: [CONTRIBUTORS.LEYLIA],
	},
	{
		date: new Date('2025-12-31'),
		Changes: () => <>Removed Manafication GCD Window; fixed the oversight on Mana gauge calcualtions with the new manafication ranged melee combo.</>,
		contributors: [CONTRIBUTORS.LEYLIA],
	},
	{
		date: new Date('2025-12-20'),
		Changes: () => <>RDM 7.4 Support added.</>,
		contributors: [CONTRIBUTORS.LEYLIA],
	},
	{
		date: new Date('2025-08-10'),
		Changes: () => <>RDM 7.3 Support added.</>,
		contributors: [CONTRIBUTORS.LEYLIA],
	},
	{
		date: new Date('2025-04-20'),
		Changes: () => <>Add informational display of Swiftcast and Lucid Dreaming usage/cooldown availability adjacent to Defensives.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
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
