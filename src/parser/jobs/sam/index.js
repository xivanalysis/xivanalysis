import React from 'react'
import {Trans} from '@lingui/react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

export default new Meta({
	modules: () => import('./modules' /*webpackChunkName: "jobs-sam" */),

	Description: () => <>
		<Trans id="sam.about.description"> <p>So you study the blade do you? Well consider this analysis the exam to see exactly how much you have learned about the basics of Samurai. This tool will track your sen and kenki gains/uses to see if you are missing possible resources to gain or you have failed to make the most out of what you gained over the course of the fight.</p> </Trans>
		<Message>
			<Icon name="info"/>
			<Trans id="sam.about.description.info"><strong>Note</strong> Unfortunately, positionals cannot be tracked at this time, and as such, Kenki values are <em>estimates</em>. Care has been taken to keep them as accurate as possible, however some innacuracies may be present.</Trans>
		</Message>

		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="sam.about.description.warning">	<strong>The module is incomplete, and only supports <em>basic</em> analysis of SAM gameplay.</strong> While the existing features below should be reasonably accurate, this system <em>is</em> still in development, and may get a little mixed up sometimes. If you notice any issues, or have any concerns, please drop by our Discord channel or report a bug on our github repository! </Trans>
			</Message.Content>
		</Message>
	</>,

	supportedPatches: {
		from: '5.05',
		to: '5.08',
	},

	contributors: [
		{user: CONTRIBUTORS.RYAN, role: ROLES.MAINTAINER},
	],

	changelog: [{
		date: new Date('2019-8-19'),
		Changes: () => <>
			5.05 SAM support plus some logic changes, including:&nbsp;
			<ul>
				<li>OGCD drift checks moved to core instead of SAM-only logic</li>
				<li>Removal of Sen overwritten allowance and returning of Hagakure</li>
				<li>Removal of Missed/Drift seconds suggestions</li>
			</ul>
		</>,
		contributors: [CONTRIBUTORS.RYAN],
	}, {
		date: new Date('2019-7-29'),
		Changes: () => <> Fixed bugs with combos and a few typos </>,
		contributors: [CONTRIBUTORS.RYAN],
	}, {
		date: new Date('2019-7-27'),
		Changes: () => <> Added Drift check and use check to Tsubame, cleaned up some displays, offical Sam support enabled </>,
		contributors: [CONTRIBUTORS.RYAN],
	}, {
		date: new Date('2019-7-24'),
		Changes: () => <>Added Drift check to Meikyo Shisui along with use check. </>,
		contributors: [CONTRIBUTORS.RYAN],
	}, {
		date: new Date('2019-07-22'),
		Changes: () => <>Fixed speed buff provided by Shifu. GCD estimations should be improved.</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	}, {
		date: new Date('2019-07-21'),
		Changes: () => <>
			Initial support for 5.0 SAM, including:&nbsp;
			<ul>
				<li>Checks for overwritten sen, with allowance for forced wastage due to Tsubame.</li>
				<li>Stricter checks for Third Eye.</li>
				<li>Removing Hagakure logic.</li>
			</ul>
		</>,
		contributors: [CONTRIBUTORS.RYAN],
	}],
})
