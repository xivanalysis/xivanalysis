import PropTypes from 'prop-types'
import React from 'react'
import {Accordion} from 'akkd'

import ContributorLabel from 'components/ui/ContributorLabel'

import styles from './ChangeLog.module.css'

export default class ChangeLog extends React.PureComponent {
	static propTypes = {
		changelog: PropTypes.arrayOf(PropTypes.shape({
			date: PropTypes.instanceOf(Date),
			contributors: PropTypes.array,
			changes: PropTypes.string,
		})),
	}

	state = {
		activeIndexes: new Set(),
	}

	handleClick = (event, props) => {
		const {index} = props
		const {activeIndexes} = this.state

		const newIndexes = new Set(activeIndexes)
		if (newIndexes.has(index)) {
			newIndexes.delete(index)
		} else {
			newIndexes.add(index)
		}

		this.setState({activeIndexes: newIndexes})
	}

	render() {
		const {activeIndexes} = this.state

		return <Accordion hasBullet={false}>
			{this.props.changelog.map((item, index) => {
				const dateString = item.date.toLocaleDateString()
				const active = activeIndexes.has(index)

				return <Accordion.Panel key={index}>
					<Accordion.Title
						index={index}
						active={active}
						onClick={this.handleClick}
						className={styles.change}
					>
						<strong className={styles.date}>{dateString}</strong>

						{!active && <span className={styles.message}><item.Changes/></span>}

						{item.contributors && item.contributors.length > 0 && (
							<div className={styles.contributors}>
								{item.contributors.map(contributor => (
									<ContributorLabel key={contributor.name} contributor={contributor} />
								))}
							</div>
						)}
					</Accordion.Title>

					<Accordion.Content active={active}>
						<item.Changes/>
					</Accordion.Content>
				</Accordion.Panel>
			})}
		</Accordion>
	}
}
