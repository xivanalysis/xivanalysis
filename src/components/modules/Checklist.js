import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import withSizes from 'react-sizes'
import {Accordion, Icon, Progress} from 'semantic-ui-react'

import styles from './Checklist.module.css'

class Checklist extends Component {
	static propTypes = {
		rules: PropTypes.arrayOf(PropTypes.shape({
			target: PropTypes.number.isRequired,
			name: PropTypes.node.isRequired,
			description: PropTypes.node,
			requirements: PropTypes.arrayOf(PropTypes.shape({
				name: PropTypes.node.isRequired,
				percent: PropTypes.number.isRequired,
			})),
			score: PropTypes.number.isRequired,
			display: PropTypes.string.isRequired,
			reqDisplay: PropTypes.func.isRequired,
			maxscore: PropTypes.number.isRequired,
			success: PropTypes.bool.isRequired,
		})),
		hideProgress: PropTypes.bool.isRequired,
	}

	render() {
		const {rules, hideProgress} = this.props
		// If there's no rules, just stop now
		if (!rules.length) { return false }

		const expanded = []
		const panels = rules.map((rule, index) => {
			if (!rule.success) {
				expanded.push(index)
			}
			return {
				// This should be a handle of some sort
				key: index,
				title: {
					className: styles.title,
					content: <Fragment>
						<Icon
							name={rule.success ? 'checkmark' : 'remove'}
							className={rule.success ? 'text-success' : 'text-error'}
						/>
						{rule.name}
						<div className={styles.percent + (rule.success ? ' text-success' : ' text-error')}>
							{rule.display}
							{hideProgress || <Progress
								percent={rule.progress}
								className={styles.progress}
								size="small"
								color={rule.success ? 'green' : 'red'}
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
									{requirement.name}: {rule.reqDisplay(requirement)}
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
