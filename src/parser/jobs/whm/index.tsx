import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {changelog} from './changelog'

const description = t('whm.about.description')`
This analyser aims to identify some of the low-hanging fruit that could be used to improve your WHM gameplay, as well as give a deeper insight into what happened during an encounter.

If you would like to learn more about WHM, check the guides over at [The Balance](https://thebalanceffxiv.com/), and have a chat in the #whm_questions channel.

Healing analysis can be very subjective - even if some of the suggestions below do not apply to you, they can help inform you about things you may have missed!
`

export const WHITE_MAGE = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-whm" */),
	Description: () => <>
		<TransMarkdown source={description}/>
	</>,

	supportedPatches: {
		from: '7.0',
		to: '7.1',
	},

	contributors: [
	// {user: CONTRIBUTORS.YOU, role: ROLES.YOUR_ROLE},
		{user: CONTRIBUTORS.INNI, role: ROLES.DEVELOPER},
	],

	changelog,
})
