import React, { Fragment } from 'react'
import { Accordion, Icon, Progress } from 'semantic-ui-react'

import Rule from './Rule'
import Module, { DISPLAY_ORDER } from 'parser/core/Module'

import styles from './Checklist.module.css'

export default class Checklist extends Module {
	static displayOrder = DISPLAY_ORDER.CHECKLIST
	name = 'Checklist'

	_rules = []

	add(rule) {
		if (!(rule instanceof Rule)) {
			console.error('TODO: This error message')
			return
		}

		this._rules.push(rule)
	}

	output() {
		// If there's no rules, just stop now
		if (!this._rules.length) { return false }

		const expanded = []
		const panels = this._rules.map((rule, index) => {
			const success = rule.percent > rule.target
			if (!success) {
				expanded.push(index)
			}
			return {
				title: {
					key: `title-${index}`,
					className: styles.title,
					content: <Fragment>
						<Icon
							name={success? 'checkmark' : 'remove'}
							className={success? 'text-success' : 'text-error'}
						/>
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
						{rule.description && <div className={styles.description}>
							{/* TODO: better styling for description */}
							<Icon name="info" size="large"/>
							<p>{rule.description}</p>
						</div>}
						<ul>
							{rule.requirements.map((requirement, index) =>
								<li key={index}>
									{requirement.name}: {requirement.percent.toFixed(2)}%
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
