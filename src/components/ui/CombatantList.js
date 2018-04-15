import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

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
		const currentFight = parseInt(this.props.currentFight, 10)

		// Filter down to just the friendlies in this fight (that aren't limit break)
		friendlies = friendlies.filter(friendly => (
			friendly.type !== 'LimitBreak' &&
			friendly.fights.filter(fight => fight.id === currentFight).length > 0
		))

		return (
			<ul>
				{friendlies.map(friend =>
					<li key={friend.id}>
						{/* TODO: This is nasty */}
						<Link to={`/analyse/${this.props.report.code}/${currentFight}/${friend.id}/`}>{friend.name}</Link>
					</li>
				)}
			</ul>
		)
	}
}

export default CombatantList
