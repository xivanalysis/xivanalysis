import {Trans} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-pld" */),

	Description: () => <>
		<Trans id="pld.about.description">
			<p>As the illegitimate child of a WHM and BLM, you chose the gory path of a shield lobbing, sword swinging Mage that also tries to help everybody out.
			</p>
			<p>This analyser attempts to find just the right things to turn you into a fearsome tank that will show no <ActionLink {...ACTIONS.CLEMENCY}/> to your enemies while being the true <ActionLink {...ACTIONS.HOLY_SPIRIT}/> of the party.
			</p>
		</Trans>
	</>,
	supportedPatches: {
		from: '5.0',
		to: '5.5',
	},
	contributors: [
		{user: CONTRIBUTORS.MIKEMATRIX, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.LHEA, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.QAPHLA, role: ROLES.DEVELOPER},
	],

	changelog: [
		{
			date: new Date('2021-08-13'),
			Changes: () => <>
				Add Atonement usage to Checklist.
			</>,
			contributors: [CONTRIBUTORS.RYAN],
		},
		{
			date: new Date('2021-04-19'),
			Changes: () => <>
				Add an Oath Gauge usage module.
			</>,
			contributors: [CONTRIBUTORS.POGRAMOS],
		},
		{
			date: new Date('2021-01-31'),
			Changes: () => <>
				Add a Tincture of Strength module.
			</>,
			contributors: [CONTRIBUTORS.YUMIYAFANGIRL],
		},
		{
			date: new Date('2020-12-07'),
			Changes: () => <>
				Mark patch 5.4 supported.
			</>,
			contributors: [CONTRIBUTORS.QAPHLA],
		},
		{
			date: new Date('2020-08-11'),
			Changes: () => <>
				Mark patch 5.3 supported.
			</>,
			contributors: [CONTRIBUTORS.ACCHAN],
		},
		{
			date: new Date('2020-04-19'),
			Changes: () => <>
				Adjust recommendations for Requiescat and Fight or Flight window lengths.
			</>,
			contributors: [CONTRIBUTORS.QAPHLA],
		},
		{
			date: new Date('2019-09-01'),
			Changes: () => <>
				Don't penalize for rushed Fight or Flight windows due to expected downtime or end-of-fight.
			</>,
			contributors: [CONTRIBUTORS.LHEA],
		},
		{
			date: new Date('2019-08-21'),
			Changes: () => <>
				Don't penalize for rushed Requiescat windows due to expected downtime or end-of-fight.
			</>,
			contributors: [CONTRIBUTORS.LHEA],
		},
		{
			date: new Date('2019-08-20'),
			Changes: () => <>
				Added usage tracking for Fight or Flight and Requiescat.
			</>,
			contributors: [CONTRIBUTORS.QAPHLA],
		},
		{
			date: new Date('2019-07-25'),
			Changes: () => <>
				Minor fix for weaving case where player leads on oGCDs.
			</>,
			contributors: [CONTRIBUTORS.LHEA],
		},
		{
			date: new Date('2019-07-23'),
			Changes: () => <>
				Fix penalties for double-weaving during an active Requiescat window.
			</>,
			contributors: [CONTRIBUTORS.LHEA],
		},
		{
			date: new Date('2019-07-18'),
			Changes: () => <>
				Basic 5.0 support for Paladin.
			</>,
			contributors: [CONTRIBUTORS.LHEA],
		},
	],
})
