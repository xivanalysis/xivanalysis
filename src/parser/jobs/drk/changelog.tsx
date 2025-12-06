import {CONTRIBUTORS} from 'data/CONTRIBUTORS'

export const changelog = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	//
	{
		date: new Date('2025-12-05'),
		Changes: () => <>Fixed minor issue where Living Shadow usages would be marked as having lost potency when only equivalent actions were replaced by Abyssal Drain.</>,
		contributors: [CONTRIBUTORS.VIOLET],
	},
	{
		date: new Date('2025-09-15'),
		Changes: () => <>Included timestamps and information about missed Dark Arts uses.</>,
		contributors: [CONTRIBUTORS.VIOLET],
	},
	{
		date: new Date('2025-09-14'),
		Changes: () => <>Added module to display Esteem's actions, as well as warning when it is interrupted in some way.</>,
		contributors: [CONTRIBUTORS.VIOLET],
	},
	{
		date: new Date('2025-08-30'),
		Changes: () => <>Display Edge and Flood of Darkness, as well as lower level Esteem actions, on the timeline for level synced content.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2025-06-30'),
		Changes: () => <>Potion windows will now expect a combination of two between Bloodspillers or Quietus, not just two Bloodspillers.</>,
		contributors: [CONTRIBUTORS.VIOLET],
	},
	{
		date: new Date('2025-06-03'),
		Changes: () => <>Corrected Shadowstride icon.</>,
		contributors: [CONTRIBUTORS.VIOLET],
	},
	{
		date: new Date('2025-06-03'),
		Changes: () => <>Fixed Delirium single target count adjustments being in the wrong order when using Impalement, and double-counting missed Delirium actions.</>,
		contributors: [CONTRIBUTORS.VIOLET],
	},
	{
		date: new Date('2025-05-23'),
		Changes: () => <>Corrected reporting of Delirium windows that involve Impalement.</>,
		contributors: [CONTRIBUTORS.VIOLET],
	},
	{
		date: new Date('2024-08-02'),
		Changes: () => <>Fixed Bloodspiller adjustment for expected uses during a potion window in the opener</>,
		contributors: [CONTRIBUTORS.AZARIAH],
	},
	{
		date: new Date('2024-07-29'),
		Changes: () => <>Fixed incorrect Blood Weapon stacks and Living Shadow no longer costs blood to use</>,
		contributors: [CONTRIBUTORS.AZARIAH],
	},
	{
		date: new Date('2024-07-07'),
		Changes: () => <>Initial Dawntrail support for Dark Knight</>,
		contributors: [CONTRIBUTORS.AZARIAH],
	},
]
