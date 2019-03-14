import cn from 'classnames'
import {ActionLink} from 'components/ui/DbLink'
import {getAction} from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import styles from './Rotation.module.css'

interface RotationProps {
	events: CastEvent[]
}

export default class Rotation extends Component<RotationProps> {
	static propTypes = {
		events: PropTypes.arrayOf(PropTypes.shape({
			ability: PropTypes.shape({
				guid: PropTypes.number.isRequired,
			}).isRequired,
		})).isRequired,
	}

	render() {
		const {events} = this.props

		return <div className={styles.container}>
			{events.map(event => {
				const action = getAction(event.ability.guid) as TODO

				// Don't bother showing the icon for autos
				if (action.autoAttack) {
					return
				}

				// Stuff like the duty action doesn't have an icon mapping yet.
				// TODO: Sort this out if it's a problem
				if (!action.icon) {
					console.error(event, 'event ability has no icon')
					return false
				}

				const linkClassName = [
					styles.link,
					{[styles.ogcd]: !action.onGcd},
				]

				const iconSize = action.onGcd ? styles.gcdSize : styles.ogcdSize

				return <div className={cn(...linkClassName)}>
					<ActionLink
						showName={false}
						iconSize={iconSize}
						{...action}
					/>
				</div>
			})}
		</div>
	}
}
