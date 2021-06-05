import cn from 'classnames'
import {ActionLink, ItemLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS, {ITEM_ID_OFFSET} from 'data/ACTIONS'
import {Cause} from 'event'
import {Ability} from 'fflogs'
import React, {Component} from 'react'
import overlayStyle from './Procs/ProcOverlay.module.css'
import styles from './Rotation.module.css'

interface RotationProps {
	events: Array<{ability?: Ability, cause?: Cause, action?: number, isProc?: boolean}>
}

export default class Rotation extends Component<RotationProps> {
	render() {
		const {events} = this.props

		return <div className={styles.container}>
			{events.map((event, index) => {
function getActionId(event): number | undefined {
    if (event.action != null) { 
        return event.action
    }
    if (event.ability != null) {
        return event.ability.guid
    }
    if (event.cause != null && event.cause.type === 'action') {
        return event.cause.action
    }
    return undefined
}

				const action = getDataBy(ACTIONS, 'id', actionId) as TODO

				// Don't bother showing the icon for autos
				if (!action || action.autoAttack) {
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
					event.isProc ? overlayStyle.procOverlay : '',
				]

				const iconSize = action.onGcd ? styles.gcdSize : styles.ogcdSize

				const isItem = action.id >= ITEM_ID_OFFSET

				const Link = isItem ? ItemLink : ActionLink

				return <div
					key={index}
					className={cn(...linkClassName)}
				>
					<Link
						showName={false}
						iconSize={iconSize}
						{...action}
					/>
				</div>
			})}
		</div>
	}
}
