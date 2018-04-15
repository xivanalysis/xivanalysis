import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import FightItem from './FightItem'

class FightList extends Component {
	static propTypes = {
		report: PropTypes.shape({
			fights: PropTypes.arrayOf(PropTypes.shape({
				id: PropTypes.number.isRequired
			})).isRequired
		}).isRequired
	}

	state = {
		killsOnly: true
	}

	render() {
		let { report } = this.props
		const { killsOnly } = this.state

		let fights = report.fights

		// Filter out trash fights w/ shoddy data, and wipes if we're filtering
		fights = fights.filter(fight => {
			if (fight.boss === 0) return false
			if (killsOnly) return fight.kill
			return true
		})

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
					{fights.map(fight => <FightItem key={fight.id} fight={fight} code={report.code}/>)}
				</div>
			</Fragment>
		)
	}
}

export default FightList
