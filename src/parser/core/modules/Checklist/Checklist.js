import React, { Fragment } from 'react'
import { Accordion, Icon, Message, Progress } from 'semantic-ui-react'

import Module, { DISPLAY_ORDER } from 'parser/core/Module'
import styles from './Checklist.module.css'

export default class Checklist extends Module {
	static displayOrder = DISPLAY_ORDER.CHECKLIST
	name = 'Checklist'

	rules = []

	output() {
		// If there's no rules, output a warning.
		if (!this.rules.length) {
			return <Message error>
				The <code>Checklist</code> module has been included in this parser, but no rules have been defined for it. Make sure you&apos;re using your own subclass, and defining the <code>rules</code> class property.
			</Message>
		}

		const expanded = []
		const panels = this.rules.map((rule, index) => {
			const success = rule.percent > 75
			if (!success) {
				expanded.push(index)
			}
			return {
				title: {
					key: `title-${index}`,
					className: styles.title,
					content: <Fragment>
						{/* Not sure 75 is a good aiming point. Maybe higher? */}
						<Icon name={success? 'checkmark' : 'remove'}/>
						{rule.name}
						{/* Using className for indicting to avoid the active animation */}
						<Progress percent={rule.percent} className={`indicating ${styles.progress}`} size="small"/>
					</Fragment>
				},
				content: {
					key: `content-${index}`,
					content: <Fragment>
						{rule.description && <Fragment>
							{/* TODO: better styling for description */}
							<Icon name="info"/>
							{rule.description}
						</Fragment>}
						<ul>
							{rule.requirements.map((requirement, index) =>
								<li key={index}>
									{requirement.name}: {requirement.percent}
								</li>
							)}
						</ul>
					</Fragment>
				}
			}
		})

		return <Accordion
			exclusive={false}
			panels={panels}
			defaultActiveIndex={expanded}
			styled fluid
		/>
	}
}
