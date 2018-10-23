import PropTypes from 'prop-types'
import React, {Component} from 'react'

import STATUSES from 'data/STATUSES'

// import styles from './BuffList.module.css'

// Simple component to spit out a list of buff icons
// Should this component be a common component like Rotation? It's very simple. - Sushi
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
				const status = STATUSES[event.ability.guid] || {}

				// TODO: Sort this out if it's a problem
				if (!status.icon) {
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
			}
			)}
		</div>
	}
}
