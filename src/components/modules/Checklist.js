import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import withSizes from 'react-sizes'
import {Accordion, Icon, Progress} from 'semantic-ui-react'

import styles from './Checklist.module.css'

export const RATING_STYLES = {
	success: {text: 'text-success', icon: 'checkmark', color: 'green'},
	fail: {text: 'text-error', icon: 'remove', color: 'red'},
	decent: {text: 'text-warning', icon: 'warning sign', color: 'yellow'},
	info: {text: 'text-info', icon: 'info', color: 'blue'},
}

class Checklist extends Component {
	static propTypes = {
		rules: PropTypes.arrayOf(PropTypes.shape({
			target: PropTypes.number.isRequired,
			name: PropTypes.node.isRequired,
			description: PropTypes.node,
			requirements: PropTypes.arrayOf(PropTypes.shape({
				name: PropTypes.node.isRequired,
				percent: PropTypes.number.isRequired,
				text: PropTypes.string.isRequired,
			})),
			text: PropTypes.string.isRequired,
			rating: PropTypes.oneOf(Object.values(RATING_STYLES)).isRequired,
		})),
		hideProgress: PropTypes.bool.isRequired,
	}

	render() {
		const {rules, hideProgress} = this.props
		// If there's no rules, just stop now
		if (!rules.length) { return false }

		const expanded = []
		const panels = rules.map((rule, index) => {
			if (rule.rating === RATING_STYLES.fail) {
				expanded.push(index)
			}
			return {
				// This should be a handle of some sort
				key: index,
				title: {
					className: styles.title,
					content: <Fragment>
						<Icon
							name={rule.rating.icon}
							className={rule.rating.text}
						/>
						{rule.name}
						<div className={styles.percent +' '+ rule.rating.text}>
							{rule.percentText}{rule.text}
							{hideProgress || <Progress
								percent={rule.percent}
								className={styles.progress}
								size="small"
								color={rule.rating.color}
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
									{requirement.name}: {requirement.percentText}{requirement.text}
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
