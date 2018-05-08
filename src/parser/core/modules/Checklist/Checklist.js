import React, { Fragment } from 'react'
import { Accordion, Icon, Progress } from 'semantic-ui-react'

import Rule from './Rule'
import Module, { DISPLAY_ORDER } from 'parser/core/Module'

import styles from './Checklist.module.css'

export default class Checklist extends Module {
	static displayOrder = DISPLAY_ORDER.CHECKLIST
	name = 'Checklist'

	rules = []

	add(rule) {
		if (!(rule instanceof Rule)) {
			console.error('TODO: This error message')
			return
		}

		this.rules.push(rule)
	}

	output() {
		// If there's no rules, just stop now
		if (!this.rules.length) { return false }

		const expanded = []
		const panels = this.rules.map((rule, index) => {
			const success = rule.percent > rule.target
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
						<Progress
							percent={rule.percent}
							className={styles.progress}
							size="small"
							color={success? 'green' : 'red'}
						/>
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
