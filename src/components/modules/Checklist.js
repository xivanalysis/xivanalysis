import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import withSizes from 'react-sizes'
import {Accordion, Icon, Progress} from 'semantic-ui-react'

import SafeTrans from 'components/ui/SafeTrans'
import styles from './Checklist.module.css'

class Checklist extends Component {
	static propTypes = {
		rules: PropTypes.arrayOf(PropTypes.shape({
			percent: PropTypes.number.isRequired,
			target: PropTypes.number.isRequired,
			i18n_id: PropTypes.string,
			name: PropTypes.node.isRequired,
			i18n_description: PropTypes.string,
			description: PropTypes.node,
			requirements: PropTypes.arrayOf(PropTypes.shape({
				i18n_id: PropTypes.string,
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
			const success = rule.percent > rule.target
			if (!success) {
				expanded.push(index)
			}
			return {
				// This should be a handle of some sort
				key: index,
				title: {
					className: styles.title,
					content: <Fragment>
						<Icon
							name={success ? 'checkmark' : 'remove'}
							className={success ? 'text-success' : 'text-error'}
						/>
						<SafeTrans id={rule.i18n_id} defaults={rule.name} />
						<div className={styles.percent + (success ? ' text-success' : ' text-error')}>
							{rule.percent.toFixed(1)}%
							{hideProgress || <Progress
								percent={rule.percent}
								className={styles.progress}
								size="small"
								color={success ? 'green' : 'red'}
							/>}
						</div>
					</Fragment>,
				},
				content: {
					content: <Fragment>
						{rule.description && <div className={styles.description}>
							<Icon name="info" size="large" />
							<p><SafeTrans id={rule.i18n_description} defaults={rule.description} /></p>
						</div>}
						{/* TODO: Better styling for these requirements */}
						<ul>
							{rule.requirements.map((requirement, index) =>
								<li key={index}>
									<SafeTrans id={requirement.i18n_id} defaults={requirement.name} />: {requirement.percent.toFixed(2)}%
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
