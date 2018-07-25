import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import styles from './about.module.css'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'

export default class About extends CoreAbout {
	description = <Fragment>
		<p>This analyzer aims to give you the information you need to turn you <span className={styles.bad}>parses</span> into <span className={styles.good}>parses</span></p>
		<p>If you would like to learn more about RDM, check the guides over at <a href="https://thebalanceffxiv.com/">The Balance</a>, and have a chat in the <code>#rdm_questions</code> channel.</p>
		<Message warning icon>
			<Icon name="warning sign"/>
			<Message.Content>
				This isn&apos;t even remotely done.
			</Message.Content>
		</Message>
	</Fragment>
	supportedPatch = '4.35'
	contributors = [
		{user: CONTRIBUTORS.LEYLIA, role: 'Maintainer'},
		{user: CONTRIBUTORS.JUMP, role: 'Theorycraft'},
	]
}
