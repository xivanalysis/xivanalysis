import {Trans} from '@lingui/react'
import React from 'react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-war" */),

	Description: () => <>
		<Trans id="war.about.description">
			<p>This analyser aims to identify some of the low-hanging fruit that could be used to improve your WAR gameplay,
					as well as give a deeper insight into what happened during an encounter.</p>
			<p>If you notice anything that looks particularly wrong, please visit our Discord server and report it in the #support channel.</p>
		</Trans>
	</>,
	supportedPatches: {
		from: '5.0',
		to: '5.2',
	},
	contributors: [
		{user: CONTRIBUTORS.SKYE, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.ACCHAN, role: ROLES.DEVELOPER},
	],

	changelog: [
		{
			date: new Date('2020-05-22'),
			contributors: [CONTRIBUTORS.ACCHAN],
			Changes: () => <>
				Add Cooldown Downtime support for Infuriate, Inner Release, and Upheaval.
			</>,
		},
		{
			date: new Date('2019-07-30'),
			contributors: [CONTRIBUTORS.SKYE],
			Changes: () => <>
				Initial changes for Shadowbringers:
				<ul>
					<li>Updated the Inner Release module to account for Inner Chaos and Chaotic Cyclone</li>
					<li>Changed the Storms Eye Module buffer to 7 seconds instead of the old 10 seconds</li>
					<li>Changed the Gauge module to track the Infuriate reduction through Inner Chaos and Chaotic Cyclone instead of Fell Cleave and Decimate</li>
				</ul>
			</>,
		},
		{
			date: new Date('2019-08-11'),
			contributors: [],
			Changes: () => <>
				Updated the Gauge module to track Infuriate reduction with all of Inner Chaos, Chaotic Cyclone, Fell Cleave, and Decimate
			</>,
		},
	],
})
