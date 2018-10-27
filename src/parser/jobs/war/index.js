import {Trans, i18nMark} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'

const description = `This analyzer aims to identify some of the low-hanging fruit that could be used to improve your WAR gameplay, as well as give a deeper insight into what happened during an encounter.
It's currently fairly feature complete, with minimal additions needed. If you need to learn how to WAR, you can always check out [The Balance](https://thebalanceffxiv.com/).
Any bugs, complaints, suggestions -- Join us on the XivA Discord, and ping me (Sayaka#6666) to let me know.`

export default {
	modules: () => import('./modules' /* webpackChunkName: "jobs-war" */),

	description: <>
		<TransMarkdown id={i18nMark('war.about.description')} source={description} />
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="war.about.description.warning">While the analysis below should be reasonably accurate, this system is still in development, and may get a little mixed up sometimes. If you notice any issues, or have any concerns, please drop by our Discord channel.</Trans>
			</Message.Content>
		</Message>
	</>,
	supportedPatches: {
		from: '4.2',
		to: '4.4',
	},
	contributors: [
		{user: CONTRIBUTORS.SAYAKA, role: ROLES.MAINTAINER},
	],

	changelog: [
		{
			date: new Date('2018-07-21'),
			changes: 'Initial release of the Warrior module.',
			contributors: [CONTRIBUTORS.SAYAKA],
		},
		{
			date: new Date('2018-07-24'),
			changes: 'Fixed Gauge calculation and added 5-GCD IR Usage timeline and warnings.',
			contributors: [CONTRIBUTORS.SAYAKA],
		},
		{
			date: new Date('2018-07-27'),
			changes: 'Added the Storm\'s Eye Module, and added the check if you\'re ending the fight inside of IR, it won\'t complain, but will still show your \'mistake\'. The rage suggestions were also changed into \'tiers\', instead of just a single suggestion. And the severity on them were rebalanced.',
			contributors: [CONTRIBUTORS.SAYAKA],
		},
		{
			date: new Date('2018-08-09'),
			changes: 'Added a graph to show your rage usage across the entire fight.',
			contributors: [CONTRIBUTORS.SAYAKA],
		},
		{
			date: new Date('2018-08-30'),
			changes: 'Hotfixed gauge lost upon death being added to the wasted gauge.',
			contributors: [CONTRIBUTORS.SAYAKA],
		},
		{
			date: new Date('2018-10-02'),
			changes: 'Localization support was added to the Warrior module.',
			contributors: [CONTRIBUTORS.SAYAKA],
		},
		{
			date: new Date('2018-10-10'),
			changes: 'Gauge module rewritten (mostly back-end changes -- Should be more accurate now), and missed combos suggestion is now supported and working.',
			contributors: [CONTRIBUTORS.SAYAKA],
		},
	],
}
