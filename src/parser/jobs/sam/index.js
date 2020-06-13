import React from 'react'
import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import TransMarkdown from 'components/ui/TransMarkdown'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

const samDescript = t('sam.about.description')`So you study the blade do you? Well consider this analysis the exam to see exactly how much you have learned about the basics of Samurai. This tool will track your Sen and Kenki gains/uses to see if you are missing possible resources to gain or you have failed to make the most out of what you gained over the course of the fight. Study guides for the exam:

- [Bushido, a PVE Samurai Guide](http://bit.ly/SAM-Guide)

- [Visual Guide to Samurai rotation](https://i.imgur.com/eHRXiZW.png)
`

export default new Meta({
	modules: () => import('./modules' /*webpackChunkName: "jobs-sam" */),

	Description: () => <>
		<TransMarkdown source={samDescript}/>
		<Message>
			<Icon name="info"/>
			<Trans id="sam.about.description.info"><strong>Note</strong> Unfortunately, positionals cannot be tracked at this time, and as such, Kenki values are <em>estimates</em>. Care has been taken to keep them as accurate as possible, however some innacuracies may be present.</Trans>
		</Message>
	</>,

	supportedPatches: {
		from: '5.1',
		to: '5.2',
	},

	contributors: [
		{user: CONTRIBUTORS.RYAN, role: ROLES.MAINTAINER},
	],

	changelog: [{
		date: new Date('2020-6-9'),
		Changes: () => <>
			Added a visual history of Higanbana that shows when and on what the dot was applied to and clipping
		</>,
		contributors: [CONTRIBUTORS.RYAN],
	}, {
		date: new Date('2020-5-14'),
		Changes: () => <>
			Updated feedback on Samurai Sen usage, also updated the header with text guides
		</>,
		contributors: [CONTRIBUTORS.RYAN],
	}, {
		date: new Date('2020-3-30'),
		Changes: () => <>
			Updated SAM support to include the interrupt module recently added to core.
		</>,
		contributors: [CONTRIBUTORS.RYAN],
	}, {
		date: new Date('2020-2-21'),
		Changes: () => <>
			Updated SAM support for patch 5.2 along with some backend changes
			<ul>
				<li> Shoha tracking has been fixed after the gauge move. Damn you SE and hiding data! </li>
				<li> AoE usage has been converted to core as requested </li>
				<li> Guren/Senei has been moved to OGCD Tracker </li>
			</ul>
		</>,
		contributors: [CONTRIBUTORS.RYAN],
	}, {
		date: new Date('2019-11-12'),
		Changes: () => <>
			Updated SAM support for patch 5.1 along with some user requested changes
			<ul>
				<li> Shoha tracking has been added along with visual </li>
				<li> Meikyo visual has been changed to show just the GCDs done under it, minus iaijutsu </li>
				<li> Changed data for patch 5.1 </li>
			</ul>
		</>,
		contributors: [CONTRIBUTORS.RYAN],
	}, {
		date: new Date('2019-9-16'),
		Changes: () => <>
			Updated SAM support based on feedback/feature requests.
			<ul>
				<li> AOE checker has been added. </li>
				<li> Meikyo now works off core so there's a nice visual </li>
				<li> Updated suggestion feedback to all minor for third eye proc spending due to small impact in the grand scheme of things </li>
			</ul>
		</>,
		contributors: [CONTRIBUTORS.RYAN],
	}, {
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
