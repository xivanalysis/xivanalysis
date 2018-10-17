import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import ACTIONS from 'data/ACTIONS'
import {ActionLink} from 'components/ui/DbLink'
import TransMarkdown from 'components/ui/TransMarkdown'
import {Trans, i18nMark} from '@lingui/react'

const description = <Fragment>
	<p>This analyzer aims to give you the information you need to turn your <span className="text-success">parses</span> into <span className="text-orange">parses</span></p>
	<p>If you would like to learn more about RDM, check the guides over at <a href="https://thebalanceffxiv.com/">The Balance</a>, and have a chat in the <code>#rdm_questions</code> channel.</p>

</Fragment>

export default {
	modules: () => import('./modules' /* webpackChunkName: "jobs-rdm" */),

	description: <>
		<TransMarkdown id={i18nMark('rdm.about.description')} source={description} />
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<Trans id="rdm.about.description.warning">Openers, advanced <ActionLink {...ACTIONS.CORPS_A_CORPS}/>, <ActionLink {...ACTIONS.DISPLACEMENT}/>, and <ActionLink {...ACTIONS.MANAFICATION}/> rules are currently not supported at this time.</Trans>
			</Message.Content>
		</Message>
</>,
	supportedPatches: {
		from: '4.2',
		to: '4.4',
	},
	contributors: [
		{user: CONTRIBUTORS.LEYLIA, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.JUMP, role: ROLES.THEORYCRAFT},
	],

	changelog: [],
}
