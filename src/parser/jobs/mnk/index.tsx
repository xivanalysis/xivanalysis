import {Trans} from '@lingui/macro'
import React from 'react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-mnk" */),

	Description: () => <>
		<Trans id="mnk.about.description">
			<p>Hello friendly monk! Do you not Crit the Boot? Does your Six-Sided Star dream remain a meme?</p>
			<p>This monk analyser aims to help you realise your true potential as a monk by highlighting issues that can
				be difficult to spot in a raw log. The main focus is on your buff windows,
				gauge and buff uptime, and ensuring your cooldowns are used.</p>
			<p>If you notice anything that looks particularly wrong, please visit our Discord server and report it in the #support channel.</p>
		</Trans>
	</>,
	supportedPatches: {
		from: '5.0',
		to: '5.2',
	},

	contributors: [
		{user: CONTRIBUTORS.ACCHAN, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.LHEA, role: ROLES.DEVELOPER},
	],
	changelog: [
		{
			date: new Date('2020-02-25'),
			Changes: () => <>
				Fix Fist chart and Bootshine incorrectly penalising post-PB crits.
			</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2019-11-20'),
			Changes: () => <>
				Mark MNK supported for Shadowbringers.
			</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2019-11-16'),
			Changes: () => <>
				Added support for Riddle of Fire window analysis.
			</>,
			contributors: [CONTRIBUTORS.LHEA, CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2019-11-16'),
			Changes: () => <>
				Updated AoE module to handle new skills and switch to core AoE module and lose my awesome variable names.
			</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2019-10-26'),
			Changes: () => <>
				Migrated to the core Gauge module.
			</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2019-10-15'),
			Changes: () => <>
				Added a new module to handle Riddle of Earth usage.
			</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2019-09-08'),
			Changes: () => <>
				Added support for Perfect Balance windows.
			</>,
			contributors: [CONTRIBUTORS.LHEA],
		},
		{
			date: new Date('2019-09-03'),
			Changes: () => <>
				Updated Twin Snakes module to account for 5.0 refresh management and rotational changes.
			</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2019-09-03'),
			Changes: () => <>
				Updated Forms for 5.05-5.08 changes.
			</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2019-08-22'),
			Changes: () => <>
				Added new module for 5.0 Dragon Kick and Bootshine.
			</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
	],
})
