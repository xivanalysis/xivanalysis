import {Trans} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

export const PALADIN = new Meta({
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
		from: '6.3',
		to: '6.45',
	},
	contributors: [
		{user: CONTRIBUTORS.STYRFIRE, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.ARIA, role: ROLES.DEVELOPER},
	],

	changelog,
})
