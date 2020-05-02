import {t} from '@lingui/macro'
import React from 'react'

import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'

const description = t('smn.about.description')`
This analyser aims to identify some of the low-hanging fruit that could be used to improve your SMN gameplay, as well as give a deeper insight into what happened during an encounter.

Due to the nature of how SMN plays, there may be a near _overwhelming_ number of suggestions showing up below. Don't fret it, just focus on one or two improvements at a time.

If you would like to learn more about SMN, check the guides over at [Akhmorning](http://www.akhmorning.com/guide/intro/), the resources at [The Balance](https://thebalanceffxiv.com/), and have a chat in the #smn channels.
`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-smn" */),

	Description: () => <>
		<TransMarkdown source={description} key="smn.about.description"/>
	</>,
	supportedPatches: {
		from: '5.1',
		to: '5.2',
	},
	contributors: [
		{user: CONTRIBUTORS.ACKWELL, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.NEMEKH, role: ROLES.THEORYCRAFT},
		{user: CONTRIBUTORS.FRYTE, role: ROLES.THEORYCRAFT},
		{user: CONTRIBUTORS.KELOS, role: ROLES.DEVELOPER},
	],

	changelog: [{
		date: new Date('2020-04-05'),
		Changes: () => <>Added a suggestion when Devotion does not hit all players.</>,
		contributors: [CONTRIBUTORS.RITASHI],
	}, {
		date: new Date('2020-04-03'),
		Changes: () => <>Converted demi ghost checking to use ghosting indications now provided in source data.</>,
		contributors: [CONTRIBUTORS.KELOS],
	}, {
		date: new Date('2020-04-03'),
		Changes: () => <>Added pet actions to timeline.</>,
		contributors: [CONTRIBUTORS.KELOS],
	}, {
		date: new Date('2020-04-03'),
		Changes: () => <>Added module to show tincture usage.</>,
		contributors: [CONTRIBUTORS.KELOS],
	}, {
		date: new Date('2020-04-03'),
		Changes: () => <>Added a Devotion Actions section to show player actions executed under the Devotion buff</>,
		contributors: [CONTRIBUTORS.RITASHI],
	}, {
		date: new Date('2020-02-16'),
		Changes: () => <>Updated DoT tables to separate applications by target and show which skill was used.</>,
		contributors: [CONTRIBUTORS.KELOS],
	}, {
		date: new Date('2020-02-12'),
		Changes: () => <>Added checks for Tri-disaster usage.</>,
		contributors: [CONTRIBUTORS.KELOS],
	}, {
		date: new Date('2019-11-8'),
		Changes: () => <>Updated Ruin 2 suggestions to account for 5.1 changes and marked supported for 5.1.</>,
		contributors: [CONTRIBUTORS.KELOS],
	}, {
		date: new Date('2019-10-31'),
		Changes: () => <>Added Aetherpact to tracked cooldowns and implemented 5.1 changes.</>,
		contributors: [CONTRIBUTORS.KELOS],
	}, {
		date: new Date('2019-10-28'),
		Changes: () => <>Fix duplicate demi-summon entries by adding a brief buffer to pet simulation re-sync when swapping pets and demis.</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	}, {
		date: new Date('2019-08-23'),
		Changes: () => <>Prevent raising weaving issues for triple weaving with <ActionLink {...ACTIONS.FIREBIRD_TRANCE}/></>,
		contributors: [CONTRIBUTORS.ACKWELL],
	}, {
		date: new Date('2019-08-16'),
		Changes: () => <>Implemented Shadowbringers changes.</>,
		contributors: [CONTRIBUTORS.KELOS],
	}],
})
