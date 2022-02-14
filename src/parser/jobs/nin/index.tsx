import {Trans} from '@lingui/react'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'

export const NINJA = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-nin" */),
	Description: () => <>
		<Trans id="nin.about.description">
			<p>Hey there, NIN friend! Are you tired of being looked down on by your MNK and BLM peers? Wish your raid team would stop using you for your Trick Attacks and appreciate you for who you really are? Well look no further! We'll help you bring yourself all the way up from <strong className="text-grey">this</strong> to <strong className="text-orange">this</strong>*!</p>
			<p>As NIN tends to be more fluid than rotational, this module contains mostly suggestions for ways you can improve your gameplay, rather than strict checklist requirements. If you see a lot, don't panic - just tackle them one at a time.</p>
			<p>*Results not guaranteed. Offer void where prohibited. Please don't sue us.</p>
		</Trans>
	</>,
	supportedPatches: {
		from: '6.05',
		to: '6.08',
	},
	contributors: [
		{user: CONTRIBUTORS.TOASTDEIB, role: ROLES.MAINTAINER},
	],
	changelog: [
		{
			date: new Date('2022-02-12'),
			Changes: () => <>Moved the Ninki gauge display from a separate chart to the timeline.</>,
			contributors: [CONTRIBUTORS.TOASTDEIB],
		},
		{
			date: new Date('2022-02-02'),
			Changes: () => <>Updated Trick Attack modules for correct handling of the opener.</>,
			contributors: [CONTRIBUTORS.TOASTDEIB],
		},
		{
			date: new Date('2022-01-10'),
			Changes: () => <>Fixed issue with GCD uptime not considering Huton active.</>,
			contributors: [CONTRIBUTORS.AZARIAH],
		},
		{
			date: new Date('2022-01-04'),
			Changes: () => <>Updated Raiju module for 6.05 changes.</>,
			contributors: [CONTRIBUTORS.TOASTDEIB],
		},
		{
			date: new Date('2021-12-29'),
			Changes: () => <>Updated suggestions for Raiton use under Trick Attack and Hellfrog use on too few targets.</>,
			contributors: [CONTRIBUTORS.TOASTDEIB],
		},
		{
			date: new Date('2021-12-17'),
			Changes: () => <>Fixed a false positive bug in the Raiju analyser.</>,
			contributors: [CONTRIBUTORS.TOASTDEIB],
		},
		{
			date: new Date('2021-12-17'),
			Changes: () => <>Updated Huton analyser for 6.0.</>,
			contributors: [CONTRIBUTORS.TOASTDEIB],
		},
		{
			date: new Date('2021-12-11'),
			Changes: () => <>Added an analyser for tracking dropped Forked/Fleeting Raiju Ready buffs.</>,
			contributors: [CONTRIBUTORS.TOASTDEIB],
		},
		{
			date: new Date('2021-12-02'),
			Changes: () => <>Updated Ninki-generated actions in the gauge simulation.</>,
			contributors: [CONTRIBUTORS.TOASTDEIB],
		},
		{
			date: new Date('2021-11-21'),
			Changes: () => <>Removed Shadow Fang and Assassinate as expected actions under Trick Attack.</>,
			contributors: [CONTRIBUTORS.TOASTDEIB],
		},
	],
})
