import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import withSizes from 'react-sizes'
import {Accordion, Icon, Progress} from 'semantic-ui-react'

import styles from './Checklist.module.css'

class Checklist extends Component {
	static propTypes = {
		rules: PropTypes.arrayOf(PropTypes.shape({
			percent: PropTypes.number.isRequired,
			target: PropTypes.number.isRequired,
			name: PropTypes.node.isRequired,
			description: PropTypes.node,
			requirements: PropTypes.arrayOf(PropTypes.shape({
				name: PropTypes.node.isRequired,
				percent: PropTypes.number.isRequired,
			})),
		})),
		hideProgress: PropTypes.bool.isRequired,
	}

	render() {
		const {rules, hideProgress} = this.props

		// If there's no rules, just stop now
		if (!rules.length) { return false }

		const expanded = []
		const panels = rules.map((rule, index) => {
			const success = rule.showAsInfo ? 3 :
				rule.percent >= rule.target ? 2:
					rule.percent >= rule.decentTarget ? 1: 0
			const classname = ['text-error', 'text-warning', 'text-success', 'text-info'][success]
			const color = ['red', 'yellow', 'green', 'blue'][success]
			const icon = ['remove', 'warning sign', 'remove', 'info'][success]
			if (success === 0) {
				expanded.push(index)
			}
			return {
				// This should be a handle of some sort
				key: index,
				title: {
					className: styles.title,
					content: <Fragment>
						<Icon
							name={icon}
							className={classname}
						/>
						{rule.name}
						<div className={styles.percent + ' ' + classname}>
							{!rule.hidePercent ? `${rule.percent.toFixed(1)}%` : ''}{rule.text}
							{hideProgress || <Progress
								percent={rule.percent}
								className={styles.progress}
								size="small"
								color={color}
							/>}
						</div>
					</Fragment>,
				},
				content: {
					content: <Fragment>
						{rule.description && <div className={styles.description}>
							<Icon name="info" size="large" />
							<p>{rule.description}</p>
						</div>}
						{/* TODO: Better styling for these requirements */}
						<ul>
							{rule.requirements.map((requirement, index) =>
								<li key={index}>
									{requirement.name}: {!requirement.hidePercent ? `${requirement.percent.toFixed(2)}%` : ''}{requirement.text}
								</li>
							)}
						</ul>
					</Fragment>,
				},
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

const mapSizesToProps = ({width}) => ({
	hideProgress: width < 992,
})

export default withSizes(mapSizesToProps)(Checklist)
