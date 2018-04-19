import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import JOBS from '@/data/JOBS'

import JobIcon from './JobIcon'

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
		currentFight: PropTypes.string.isRequired
	}

	render() {
		let { friendlies } = this.props.report
		const currentFight = this.props.currentFight

		// Filter down to just the friendlies in this fight (that aren't limit break)
		friendlies = friendlies.filter(friendly => (
			friendly.type !== 'LimitBreak' &&
			friendly.fights.filter(fight => fight.id === currentFight).length > 0
		))

		return (
			<ul>
				{friendlies.map(friend =>
					<li key={friend.id}>
						{/* TODO: This is legit trash */}
						<Link to={`/analyse/${this.props.report.code}/${currentFight}/${friend.id}/`}>
							<JobIcon job={JOBS[friend.type]}/>
							{friend.name}
						</Link>
					</li>
				)}
			</ul>
		)
	}
}

export default CombatantList
