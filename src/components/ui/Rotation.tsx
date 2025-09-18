import cn from 'classnames'
import {ActionLink, ItemLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import {ACTIONS, ITEM_ID_OFFSET} from 'data/ACTIONS'
import {Cause} from 'event'
import {Component} from 'react'
import overlayStyle from './Procs/ProcOverlay.module.css'
import styles from './Rotation.module.css'

export interface RotationEvent {
	cause?: Cause,
	action?: number
	isProc?: boolean
	forceGCDSizeAndStyle?: boolean
}
interface RotationProps {
	events: RotationEvent[]
}

export class Rotation extends Component<RotationProps> {
	getActionId(event: RotationEvent): number | undefined {
		if (event.action != null) {
			return event.action
		}
		if (event.cause != null && event.cause.type === 'action') {
			return event.cause.action
		}
		return undefined
	}

	override render() {
		const {events} = this.props

		return <div className={styles.container}>
			{events.map((event, index) => {
				const actionId = this.getActionId(event)

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

				const isGCD = !!action.onGcd || !!event.forceGCDSizeAndStyle

				const linkClassName = [
					styles.link,
					{[styles.ogcd]: !isGCD},
					event.isProc ? overlayStyle.procOverlay : '',
				]

				const iconSize = isGCD ? styles.gcdSize : styles.ogcdSize

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
