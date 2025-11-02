import {CONTRIBUTORS} from 'data/CONTRIBUTORS'

export const changelog = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2025-11-02'),
		Changes: () => <>Update for patch 7.3.</>,
		contributors: [CONTRIBUTORS.YUZUKITSURU],
	},
	{
		date: new Date('2025-04-29'),
		Changes: () => <>Update for patch 7.2.</>,
		contributors: [CONTRIBUTORS.YUZUKITSURU],
	},
	{
		date: new Date('2024-10-20'),
		Changes: () => <>Add prepend messages info for buff window GCD trackers.</>,
		contributors: [CONTRIBUTORS.YUZUKITSURU],
	},
	{
		date: new Date('2024-10-13'),
		Changes: () => <>Remove buff window GCD trackers filter for more intuitively display the correct GCD wave.</>,
		contributors: [CONTRIBUTORS.YUZUKITSURU],
	},
	{
		date: new Date('2024-08-31'),
		Changes: () => <>Added buff window GCD trackers for Raging Strikes, Battle Voice, Radiant Finale and Army's Muse.</>,
		contributors: [CONTRIBUTORS.YUMIYA],
	},
	{
		date: new Date('2024-08-24'),
		Changes: () => <>Fix a buff tracking issue that could cause the Burst Window tracking to close the window early.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-08-23'),
		Changes: () => <>Added soul voice and repertoire gauge tracking when gauge information is available.</>,
		contributors: [CONTRIBUTORS.YUMIYA],
	},
	{
		date: new Date('2024-07-28'),
		Changes: () => <>Removed Raging Strikes module and added a Burst Window module.</>,
		contributors: [CONTRIBUTORS.YUMIYA],
	},
]
