import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'
import {ChangelogEntry} from './Meta'

export const changelog: ChangelogEntry[] = [
	{
		date: new Date('2019-08-24'),
		Changes: () => <>Show pre-pull skill uses on timeline when we can determine a skill was used because the player started with a buff.</>,
		contributors: [CONTRIBUTORS.AZARIAH],
	},
	{
		date: new Date('2019-08-14'),
		Changes: () => <>
			A few changes to improve the accuracy of core metrics and displays:
			<ul>
				<li>Improve GCD calculations for actions with a recast less than 2.5 seconds. Jobs such as DNC should no longer occasionally recieve incredibly short GCD estimates.</li>
				<li>Fix actor filters for secondary event query. Raid buffs applied by other players should be visible again.</li>
			</ul>
		</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	},
	{
		date: new Date('2019-07-20'),
		Changes: () => <>Add handling for GCD actions with recasts longer than the player GCD. This should impove GCD estimation accuracy and timeline display for DNC, GNB, and MCH.</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	},
]
