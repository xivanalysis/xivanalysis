import PropTypes from 'prop-types'
import React, {Component} from 'react'

import {getDataBy} from 'data'
import STATUSES from 'data/STATUSES'

// import styles from './BuffList.module.css'

// Simple component to spit out a list of buff icons
// Obsolete now that there's no need to track buff extensions, but could still come in handy for displaying card buffs on people! - Sushi
export default class BuffList extends Component {
	static propTypes = {
		events: PropTypes.arrayOf(PropTypes.shape({
			ability: PropTypes.shape({
				guid: PropTypes.number.isRequired,
			}).isRequired,
		})).isRequired,
	}

	render() {
		return <div>
			{this.props.events.map(event => {
				const status = getDataBy(STATUSES, 'id', event.ability.guid)

				// TODO: Sort this out if it's a problem
				if (!status || !status.icon) {
					console.error(event, 'event ability has no icon')
					return false
				}

				const key = 'buff-' + status.name + status.timestamp

				return <img
					key={key}
					src={status.icon}
					// className={className.join(' ')}
					alt={status.name}
				/>
			})}
		</div>
	}
}
