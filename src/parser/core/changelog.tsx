import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'
import {ChangelogEntry} from './Meta'

export const changelog: ChangelogEntry[] = [
	{
		date: new Date('2020-04-19'),
		Changes: () => <>
			Overhaul of logic used to calculate when the boss is invulnerable and/or untargetable. This will have minimal impact on DPS and tanks with average or better play - however, it will have a <em>marked</em> impact on low-uptime play and healer accuracy.<br/>
			This is a very large change that has been <em>years</em> in the making - and while no effort has been spared to ensure its accuracy, it may have some edge cases we missed. If you see something that looks wrong, please feel free to drop by the discord server, and we can double check to make sure its behaving as it should.
		</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	},
	{
		date: new Date('2020-04-10'),
		Changes: () => <>Total rewrite of the timeline. While it looks and behaves in a similar manner to the previous timeline, it has been rewritten from scratch, allowing analysis to expose much more detailed information in the timeline with future changes.</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	},
	{
		date: new Date('2019-11-22'),
		Changes: () => <>Rework calculations for tracked cooldowns to improve methodology for tracking actual uses and calculating expected uses.</>,
		contributors: [CONTRIBUTORS.AZARIAH, CONTRIBUTORS.KELOS],
	},
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
