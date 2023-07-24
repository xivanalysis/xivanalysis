import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'

const description = t('gnb.about.description')`This analyzer looks for the low-hanging, easy to spot issues in your gameplay that can be fixed to improve your damage across a fight as Gunbreaker.
If you're looking to learn about how exactly the job plays and functions from the ground up, take a look at a few basic guides:

* [General tanking guide by Aletin](https://goo.gl/nYzAnq)

If you have any suggestions about the module, feel free to join the XIVA discord and use the feedback channels.
`

export const GUNBREAKER = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-gnb" */),

	Description: () => <TransMarkdown source={description}/>,

	supportedPatches: {
		from: '6.0',
		to: '6.45',
	},

	contributors: [
		{user: CONTRIBUTORS.RYAN, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.JONNIX, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.EDEN, role: ROLES.DEVELOPER},
	],

	changelog: [
		// {
		// 	date: new Date('2020-04-20'),
		// 	Changes: () => <>The changes you made</>,
		// 	contributors: [CONTRIBUTORS.YOU],
		// },
		{
			date: new Date('2021-07-19'),
			Changes: () => <>
				<ul>
					<li>i18n improvements</li>
					<li>String formatting corrections</li>
				</ul>,
			</>,
			contributors: [CONTRIBUTORS.KHAYLE],
		},
		{
			date: new Date('2021-12-11'),
			Changes: () => <>
				<ul>
					<li>GNB updated to include 6.0 Actions/Statues on timeline.</li>
					<li>Cooldown adjusted to include Double Down / New Opener.</li>
				</ul>,
			</>,
			contributors: [CONTRIBUTORS.RYAN],
		},
		{
			date: new Date('2021-12-19'),
			Changes: () => <>
				<ul>
					<li>Added cartridge usage for Double Down to Ammo module</li>
				</ul>,
			</>,
			contributors: [CONTRIBUTORS.JONNIX],
		},
		{
			date: new Date('2021-12-19'),
			Changes: () => <>
				<ul>
					<li>Fix Lightning Shot breaking combo</li>
				</ul>,
			</>,
			contributors: [CONTRIBUTORS.RYAN],
		},
		{
			date: new Date('2021-12-21'),
			Changes: () => <>
				<ul>
					<li>Reorder Heart of Corundum in Timeline together with other party mitigations.</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.EDEN],
		},
		{
			date: new Date('2021-12-28'),
			Changes: () => <>
				<ul>
					<li>Add Double Down to No Mercy window, and update Blast Shot GCD counts</li>
				</ul>,
			</>,
			contributors: [CONTRIBUTORS.JONNIX],
		},
		{
			date: new Date('2022-1-02'),
			Changes: () => <>
				<ul>
					<li>Fixed Bug with GNB Opener expecting full burst</li>
					<li>Updated GNB info links and mark as supported for 6.0</li>
				</ul>,
			</>,
			contributors: [CONTRIBUTORS.RYAN],
		},
		{
			date: new Date('2022-1-04'),
			Changes: () => <>
				<ul>
					<li>Mark Gunbreaker as supported for 6.05</li>
				</ul>,
			</>,
			contributors: [CONTRIBUTORS.RYAN],
		},

		{
			date: new Date('2022-1-05'),
			Changes: () => <>
				<ul>
					<li>Change AoE Threshold to 2 for everything</li>
				</ul>,
			</>,
			contributors: [CONTRIBUTORS.RYAN],
		},

		{
			date: new Date('2022-03-12'),
			Changes: () => <>
				<ul>
					<li>Added Double Down to expected actions under tincture</li>
				</ul>,
			</>,
			contributors: [CONTRIBUTORS.RYAN],
		},
	],
})
