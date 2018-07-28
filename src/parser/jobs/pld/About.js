import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import CONTRIBUTORS from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'

export default class About extends CoreAbout {
	description = <Fragment>
		<p>As the illegitimate child of a WHM and BLM, you chose the Gory Path of a shield lobing, sword swinging Mage, that also tries to help everybody out.</p>
		<p>This analyzer attempts to find just the right things to get you to be a fearsome Tank, that will show no <ActionLink {...ACTIONS.CLEMENCY}/> to his enemies, while being the true <ActionLink {...ACTIONS.HOLY_SPIRIT}/> of the Party.</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				<p><b>Here be Dragons!</b></p>
				<div>This Analyzer is still <b>Work in Progress</b> and is missing a lot of features as well as simplifying a couple of things for now.</div>
				<div>Make sure to take the advice still with a grain of Salt.</div>
				<div>If you notice any issues, have concerns or suggestions, please drop by our Discord channel!</div>
			</Message.Content>
		</Message>
	</Fragment>
	supportedPatch = '4.35'
	contributors = [
		{user: CONTRIBUTORS.MIKEMATRIX, role: 'Maintainer'},
	]
}
