import React, { Component } from 'react'
import PropTypes from 'prop-types'

class FightItem extends Component {
	static propTypes = {
		fight: PropTypes.shape({
			name: PropTypes.string.isRequired,
			zoneName: PropTypes.string.isRequired
		}).isRequired
	}

	render() {
		const { fight } = this.props
		return (
			<div className="fight">
				<div className="bg"></div>
				<div className="title">
					<div className="zone">{fight.zoneName}</div>
					<div className="boss">{fight.name}</div>
				</div>
			</div>
		)
	}
}

class FightList extends Component {
	static propTypes = {
		fights: PropTypes.arrayOf(PropTypes.shape({
			id: PropTypes.number.isRequired
		})).isRequired
	}

	render() {
		const { fights } = this.props

		return (
			<div className="fights">
				{fights.map(fight => <FightItem key={fight.id} fight={fight}/>)}
			</div>
		)
	}
}

export default FightList
