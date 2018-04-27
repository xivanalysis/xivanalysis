import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import ZONES from 'data/ZONES'

class FightItem extends Component {
	static propTypes = {
		fight: PropTypes.shape({
			id: PropTypes.number.isRequired,
			zoneID: PropTypes.number.isRequired,
			kill: PropTypes.bool.isRequired,
			fightPercentage: PropTypes.number.isRequired,
			name: PropTypes.string.isRequired,
			zoneName: PropTypes.string.isRequired,
			start_time: PropTypes.number.isRequired,
			end_time: PropTypes.number.isRequired
		}).isRequired,
		code: PropTypes.string.isRequired
	}

	formatDuration(duration) {
		const seconds = Math.floor(duration % 60)
		return `${Math.floor(duration / 60)}:${seconds < 10? '0' : ''}${seconds}`
	}

	render() {
		const {
			id, zoneID,
			kill, fightPercentage,
			start_time, end_time,
			name, zoneName
		} = this.props.fight

		const code = this.props.code

		const backgroundStyle = {}
		const zone = ZONES[zoneID]
		if (zone) {
			backgroundStyle.backgroundImage = `url(${zone.banner})`
		}

		const url = `/find/${code}/${id}/`
		const colour = kill? 'success' : 'danger'
		const progress = Math.round(100 - (fightPercentage/100)) + '%'
		const duration = Math.round((end_time - start_time)/1000)

		return (
			<Link to={url} className="fight text-light">
				<div className="bg" style={backgroundStyle}></div>
				<div className="title">
					<div className="zone">{zoneName}</div>
					<div className="boss">{name}</div>
				</div>
				<div className="detail">
					<span className={`text-${colour}`}>{this.formatDuration(duration)}</span>
					<div className="progress bg-dark">
						<div className={`progress-bar bg-${colour}`} style={{width: progress}}></div>
					</div>
				</div>
			</Link>
		)
	}
}

export default FightItem
