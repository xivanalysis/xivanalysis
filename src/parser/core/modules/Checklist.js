import React, { Fragment } from 'react'
import { Accordion, Icon, Progress } from 'semantic-ui-react'

import Module, { DISPLAY_ORDER } from 'parser/core/Module'
import styles from './Checklist.module.css'

export default class Checklist extends Module {
	static displayOrder = DISPLAY_ORDER.FIRST

	output() {
		const panels = [{
			title: {
				key: 'title-1',
				// Children so I override their dropdown icon
				className: styles.title,
				children: <Fragment>
					<Icon name="checkmark"/>
					<Icon name="remove"/>
					Title
					<Progress
						percent="54"
						// Using className instead of the prop for indicating to avoid the active animation
						className={`indicating ${styles.progress}`}
						size="small"
					/>
				</Fragment>
			},
			content: {
				key: 'content-1',
				content: 'content'
			}
		}]

		return <Accordion exclusive={false} panels={panels} styled/>
	}
}
