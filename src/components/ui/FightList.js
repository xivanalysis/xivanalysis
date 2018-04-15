import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import FightItem from './FightItem'

class FightList extends Component {
	static propTypes = {
		fights: PropTypes.arrayOf(PropTypes.shape({
			id: PropTypes.number.isRequired
		})).isRequired
	}

	state = {
		killsOnly: true
	}

	render() {
		let { fights } = this.props
		const { killsOnly } = this.state

		if (killsOnly) {
			fights = fights.filter(fight => fight.kill)
		}

		return (
			<Fragment>
				<div className="custom-control custom-checkbox">
					<input
						type="checkbox"
						checked={killsOnly}
						className="custom-control-input"
						id="kills-only"
						onChange={e => this.setState({killsOnly: e.currentTarget.checked})}
					/>
					<label htmlFor="kills-only" className="custom-control-label">Kills only</label>
				</div>
				<div className="fights">
					{fights.map(fight => <FightItem key={fight.id} fight={fight}/>)}
				</div>
			</Fragment>
		)
	}
}

export default FightList
