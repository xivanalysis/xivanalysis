import {Trans} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'

export const BARD = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-brd" */),
	Description: () => <>
		<Trans id="brd.about.description">
			<p>Welcome to the Bard module! Despite being a very straightforward job, Bard's complexity is deceiving.</p>
			<p>Considered by many as an <i>"easy to learn, hard to master"</i> job, Bard is a job that relies heavily on decision-making.</p>
			<p>Improvements on Bard can range from the fundamentals of properly utilizing songs (<ActionLink action="THE_WANDERERS_MINUET"/>, <ActionLink action="MAGES_BALLAD"/> and <ActionLink action="ARMYS_PAEON"/>) up to the intricacies of <ActionLink action="IRON_JAWS"/> and the concept of buff/debuff snapshotting.</p>
			<p>This analyzer will guide you through the job's core mechanics, all the way to encounter-specific optimization.</p>
		</Trans>
	</>,
	supportedPatches: {
		from: '6.0',
		to: '6.0',
	},
	contributors: [
		{user: CONTRIBUTORS.HINT, role: ROLES.MAINTAINER},
	],
	changelog: [
		{
			date: new Date('2021-12-17'),
			Changes: () => <>Updated Bard modules for Endwalker.</>,
			contributors: [CONTRIBUTORS.HINT],
		},
	],
})
