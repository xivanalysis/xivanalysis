import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { Checkbox } from 'semantic-ui-react'

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
				<Checkbox
					toggle
					label='Kills only'
					defaultChecked={killsOnly}
					onChange={(_, data) => this.setState({killsOnly: data.checked})}
				/>
				<div className="fights">
					{fights.map(fight => <FightItem key={fight.id} fight={fight} code={report.code}/>)}
				</div>
			</Fragment>
		)
	}
}

export default FightList
