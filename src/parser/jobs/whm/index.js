import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'

const description = t('whm.about.description')`
This analyser aims to identify some of the low-hanging fruit that could be used to improve your WHM gameplay, as well as give a deeper insight into what happened during an encounter.

Note that since healing is a very fight-dependent process, it might be that some suggestions do not apply to you, but they may they help to inform you about things you have missed.

If you would like to learn more about WHM, check the guides over at [The Balance](https://thebalanceffxiv.com/), and have a chat in the #whm_questions channel.
`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-whm" */),
	Description: () => <>
		<TransMarkdown source={description}/>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="whm.about.description.devwarning">The WHM module is still in a very early developement stage.  If you notice any issues, or have any concerns, or suggestions on what you would like this module to analyze next, please drop by our Discord channel!</Trans>
			</Message.Content>
		</Message>
		<Trans id="whm.about.description.support">Currently this module can track DoT uptime, Lily and Blood Lily Usage, and detect clipping and report about missed Divine Benison and Assize casts.</Trans>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="whm.about.description.invulnwarning">Currently, for all healers, boss invulnerability checking doesn't function properly. This results in inaccuracy for many time-related functions such as the Always be casting checklist item or DoT uptime.</Trans>
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '5.0',
		to: '5.08',
	},
	contributors: [
		{user: CONTRIBUTORS.NIV, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.VULCWEN, role: ROLES.DEVELOPER},
		{user: CONTRIBUTORS.SUSHIROU, role: ROLES.DEVELOPER},
	],
	changelog: [
		{
			date: new Date('2019-08-24'),
			Changes: () => <>
				Added Swiftcast module.
			</>,
			contributors: [CONTRIBUTORS.NIV],
		},
		{
			date: new Date('2019-07-08'),
			Changes: () => <>
				Initial changes for Shadowbringers:&nbsp;
				<ul>
					<li>Updated cast time for Cure and Medica II</li>
					<li>Added new actions: Dia, Glare, Afflatus Solace, Afflatus Rapture, Afflatus Misery, and Temperance</li>
					<li>Updated DoT module to check Dia uptime, and removed Aero II and Aero III checks</li>
					<li>Removed outdated modules</li>
					<li>Added new Lilies module</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.NIV],
		},
	],
})
