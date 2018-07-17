import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import {Checkbox, Header, Icon, Menu} from 'semantic-ui-react'

import FightItem from './FightItem'
import ZONES from 'data/ZONES'
import store from 'store'
import {refreshReport} from 'store/actions'

import styles from './FightList.module.css'

class FightList extends Component {
	static propTypes = {
		report: PropTypes.shape({
			fights: PropTypes.arrayOf(PropTypes.shape({
				id: PropTypes.number.isRequired,
			})).isRequired,
		}).isRequired,
	}

	state = {
		killsOnly: true,
	}

	refreshFights = () => {
		store.dispatch(refreshReport())
	}

	render() {
		const {report} = this.props
		const {killsOnly} = this.state

		// Build a 2d array, grouping fights by the zone they take place in
		const fights = []
		let lastZone = null
		report.fights.forEach(fight => {
			// Filter out trash fights w/ shoddy data, and wipes if we're filtering
			if (fight.boss === 0 || (killsOnly && !fight.kill)) {
				return
			}

			// If this is a new zone, add a new grouping
			if (fight.zoneID !== lastZone) {
				fights.push({
					zone: {
						...ZONES[fight.zoneID],
						name: fight.zoneName,
					},
					fights: [],
				})
				lastZone = fight.zoneID
			}

			// Add the fight to the current grouping
			fights[fights.length-1].fights.push(fight)
		})

		return <Fragment>
			<Header>
				Select a pull
				<div className="pull-right">
					<Checkbox
						toggle
						label="Kills only"
						defaultChecked={killsOnly}
						onChange={(_, data) => this.setState({killsOnly: data.checked})}
						// className="pull-right"
					/>
					<span className={styles.refresh} onClick={this.refreshFights}>
						<Icon name="refresh"/>
						Refresh
					</span>
				</div>
			</Header>

			{fights.map((group, index) => <Fragment key={index}>
				<Header
					attached="top"
					inverted
					className={group.zone.banner && styles.groupHeader}
				>
					{group.zone.banner && <div
						className={styles.groupHeaderBackground}
						style={{backgroundImage: `url(${group.zone.banner})`}}
					/>}
					{group.zone.name}
				</Header>
				<Menu attached="bottom" fluid vertical>
					{group.fights.map(fight => <FightItem key={fight.id} fight={fight} code={report.code}/>)}
				</Menu>
			</Fragment>)}
		</Fragment>
	}
}

export default FightList
