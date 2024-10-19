import {Trans} from '@lingui/macro'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

export const VIPER = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-vpr" */),

	Description: () => <>
		<Trans id ="vpr.about.description">
			<p>Are you a fresh Viper, trying to make heads and tails of this strange serpent job and its offerings? Are you desperately trying to figure out how to make the most of your venomous abilities as you slither through the battlefield? Look no further!</p>
			<p>VPR is a fast-paced melee job that uses the classic build and spend job gauge resource system to unleash a powerful burst window, all while gaining and using various buffs on themselves to maximize their damage output.</p>
			<p>As such this XIVA Module focuses on ensuring you are making the most of your resources, and using your abilities to their fullest potential.</p>
			<p>If see a lot of suggestions, don't worry and just take small bites at it! You'll be slithering through the battlefield leaving behind your legacy for the next generation in no time!</p>
		</Trans>
	</>,

	supportedPatches: {
		from: '7.05',
		to: '7.05',
	},

	contributors: [
		{user: CONTRIBUTORS.RYAN, role: ROLES.DEVELOPER},
	],

	changelog,
})
