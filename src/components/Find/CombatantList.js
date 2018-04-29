import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Header, Menu } from 'semantic-ui-react'

import styles from './CombatantList.module.css'
import JOBS from 'data/JOBS'
import JobIcon from 'components/ui/JobIcon'

class CombatantList extends Component {
	static propTypes = {
		report: PropTypes.shape({
			code: PropTypes.string.isRequired,
			friendlies: PropTypes.arrayOf(PropTypes.shape({
				id: PropTypes.number.isRequired,
				name: PropTypes.string.isRequired,
				type: PropTypes.string.isRequired,
				fights: PropTypes.arrayOf(PropTypes.shape({
					id: PropTypes.number.isRequired
				})).isRequired
			})).isRequired
		}).isRequired,
		currentFight: PropTypes.number.isRequired
	}

	render() {
		let { friendlies } = this.props.report
		const currentFight = this.props.currentFight

		// Filter down to just the friendlies in this fight (that aren't limit break)
		// TODO: Group by role?
		friendlies = friendlies.filter(friendly => (
			friendly.type !== 'LimitBreak' &&
			friendly.fights.filter(fight => fight.id === currentFight).length > 0
		))

		return <Fragment>
			<Header>
				Select a combatant
			</Header>

			<Menu fluid vertical>
				{friendlies.map(friend =>
					// TODO: This is legit trash
					<Menu.Item
						key={friend.id}
						as={Link}
						to={`/analyse/${this.props.report.code}/${currentFight}/${friend.id}/`}
					>
						<JobIcon job={JOBS[friend.type]} className={styles.jobIcon}/>
						{friend.name}
					</Menu.Item>
				)}
			</Menu>
		</Fragment>
	}
}

export default CombatantList
