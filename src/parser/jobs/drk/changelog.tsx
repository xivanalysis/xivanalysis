import {CONTRIBUTORS} from 'data/CONTRIBUTORS'

export const changelog = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
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
