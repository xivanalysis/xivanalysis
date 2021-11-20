import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'

const description = t('whm.about.description')`
This analyser aims to identify some of the low-hanging fruit that could be used to improve your WHM gameplay, as well as give a deeper insight into what happened during an encounter.

If you would like to learn more about WHM, check the guides over at [The Balance](https://thebalanceffxiv.com/), and have a chat in the #whm_questions channel.

Currently this module can track DoT uptime, note when your healing lily gauge is full, detect clipping, detect interrupted casts, and report about missed oGCD casts.

Healing analysis can be very subjective - even if some of the below suggestions do not apply to you, they can help inform you about things you may have missed
`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-whm" */),
	Description: () => <>
		<TransMarkdown source={description}/>
	</>,
	supportedPatches: {
		from: '5.0',
		to: '5.5',
	},
	contributors: [
		{user: CONTRIBUTORS.NIV, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.VULCWEN, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.SUSHIROU, role: ROLES.DEVELOPER},
	],
	changelog: [
		{
			date: new Date('2021-10-28'),
			Changes: () => <>Improve overheal calculations to better consider casts that fully overheal.</>,
			contributors: [CONTRIBUTORS.AZARIAH],
		},
		{
			date: new Date('2021-05-21'),
			Changes: () => <>Add 5.5 support for WHM</>,
			contributors: [CONTRIBUTORS.ASHE],
		},
		{
			date: new Date('2021-01-08'),
			Changes: () => <>Add 5.4 support for WHM</>,
			contributors: [CONTRIBUTORS.SHIRK],
		},
		{
			date: new Date('2020-08-12'),
			Changes: () => <>Add 5.3 support for WHM</>,
			contributors: [CONTRIBUTORS.NONO],
		},
		{
			date: new Date('2020-03-08'),
			Changes: () => <>Add interrupt tracking to WHM – a big thank you to Levi and everyone in #whm_lounge for their help.</>,
			contributors: [CONTRIBUTORS.NONO],
		},
		{
			date: new Date('2020-02-27'),
			Changes: () => <>Update WHM for 5.2 support.</>,
			contributors: [CONTRIBUTORS.NONO],
		},
		{
			date: new Date('2019-09-04'),
			Changes: () => <>Track oGCDs with more clarity.</>,
			contributors: [CONTRIBUTORS.NIV],
		},
		{
			date: new Date('2019-08-24'),
			Changes: () => <>
				Added Swiftcast module.
			</>,
			contributors: [CONTRIBUTORS.NIV],
		},
		{
			date: new Date('2019-07-08'),
			Changes: () => <>
				Initial changes for Shadowbringers:&nbsp;
				<ul>
					<li>Updated cast time for Cure and Medica II</li>
					<li>Added new actions: Dia, Glare, Afflatus Solace, Afflatus Rapture, Afflatus Misery, and Temperance</li>
					<li>Updated DoT module to check Dia uptime, and removed Aero II and Aero III checks</li>
					<li>Removed outdated modules</li>
					<li>Added new Lilies module</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.NIV],
		},
	],
})
