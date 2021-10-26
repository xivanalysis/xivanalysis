import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import STATUSES from 'data/STATUSES'
import {Meta} from 'parser/core/Meta'
import React from 'react'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-blm" */),

	Description: () => <>
		<Trans id="blm.about.description">This analyser aims to identify how you're not actually casting <ActionLink {...ACTIONS.FIRE_IV} /> as much as you think you are.</Trans>
	</>,
	supportedPatches: {
		from: '5.0',
		to: '5.5',
	},
	contributors: [
		{user: CONTRIBUTORS.FURST, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.LAQI, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.AKAIRYU, role: ROLES.DEVELOPER},
	],
	changelog: [{
		date: new Date('2019-07-17'),
		Changes: () => <>Initial Black Mage support for Shadowbringers expansion</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2019-07-18'),
		Changes: () => <>New suggestion for Manafont and cleaned up F4 counts</>,
		contributors: [CONTRIBUTORS.FURST],
	},
	{
		date: new Date('2019-07-20'),
		Changes: () => <>Keep track of, and warn against dropping, <StatusLink {...STATUSES.SHARPCAST} /> buffs.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2019-07-28'),
		Changes: () => <>Significant rework of Rotation Outliers display and related suggestions.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2019-09-16'),
		Changes: () => <>Fix expected Fire IV count for openers.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2019-09-23'),
		Changes: () => <>Improved gauge state error handling.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2019-10-22'),
		Changes: () => <>Enochian buffs lost during extended cutscenes, and certain Astral Fire phase optimizations, will no longer be unintentionally penalized.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2020-04-27'),
		Changes: () => <>Added a Thunder module that lists how much you clipped your DoT.</>,
		contributors: [CONTRIBUTORS.FURST],
	},
	{
		date: new Date('2020-05-26'),
		Changes: () => <>(Modified) Jp Opener is no longer falsely flagged.</>,
		contributors: [CONTRIBUTORS.FURST],
	},
	{
		date: new Date('2021-03-18'),
		Changes: () => <>Forgive single-weave Triplecast in JP opener.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-04-08'),
		Changes: () => <>Updated Rotation Outliers suggestions for cycles before downtimes, and Umbral Soul usage during uptime.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2021-06-18'),
		Changes: () => <>Updated Astral Fire/Umbral Ice cycle tracking for improved analysis accuracy.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	}],
})
