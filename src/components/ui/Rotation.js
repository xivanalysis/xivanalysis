import PropTypes from 'prop-types'
import React, {Component} from 'react'

import {getAction} from 'data/ACTIONS'

import styles from './Rotation.module.css'

export default class Rotation extends Component {
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
				const action = event.ability.overrideAction ? event.ability.overrideAction : getAction(event.ability.guid)

				// Stuff like the duty action doesn't have an icon mapping yet.
				// TODO: Sort this out if it's a problem
				if (!action.icon) {
					console.error(event, 'event ability has no icon')
					return false
				}

				const className = [styles.action]
				if (!action.onGcd) {
					className.push(styles.ogcd)
				}

				return <img
					key={event.timestamp}
					src={action.icon}
					className={className.join(' ')}
					alt={action.name}
				/>
			}
			)}
		</div>
	}
}
