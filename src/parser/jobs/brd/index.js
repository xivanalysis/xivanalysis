import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-brd" */),

	Description: () => <>
		<p>Welcome to the Bard module! Despite being a very straightforward job, Bard's complexity is deceiving.</p>
		<p>Considered by many as an <i>"easy to learn, hard to master"</i> job, Bard is a job that relies heavily on decision-making.</p>
		<p>Improvements on Bard can range from the fundamentals of properly utilizing songs (<ActionLink {...ACTIONS.THE_WANDERERS_MINUET}/>, <ActionLink {...ACTIONS.MAGES_BALLAD}/> and <ActionLink {...ACTIONS.ARMYS_PAEON}/>) up to the intricacies of <ActionLink {...ACTIONS.IRON_JAWS}/> and the concept of buff/debuff snapshotting.</p>
		<p>This analyzer will guide you through the job's core mechanics, all the way to encounter-specific optimization.</p>
	</>,
	// supportedPatches: {
	// 	from: '6.0',
	// 	to: '6.0',
	// },
	contributors: [
		{user: CONTRIBUTORS.YUMIYAFANGIRL, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.YUMIYA, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.RIRIAN, role: ROLES.DEVELOPER},
	],
	changelog,
})
