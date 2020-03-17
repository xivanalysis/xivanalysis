import classNames from 'classnames'
import React from 'react'
import {Icon, SemanticICONS} from 'semantic-ui-react'
import styles from './Message.module.css'
import {MessageHeader} from './MessageHeader'

interface MessageTypes {
	error?: boolean
	warning?: boolean
	info?: boolean
	success?: boolean
	default?: boolean
}

const typePrecedence: ReadonlyArray<keyof MessageTypes> = [
	'error',
	'warning',
	'info',
	'success',
	'default',
]

interface Props extends MessageTypes {
	as?: React.ReactType,
	className?: string,
	// TODO: Replace with straight FA once we rip SUI out
	icon?: SemanticICONS,
	box?: boolean,
}

export class Message extends React.PureComponent<Props> {
	static Header = MessageHeader

	render() {
		const {as: Component = 'div', className, icon, box = false, children} = this.props

		// Find the first message type that's truthy
		const type = typePrecedence.find(prop => this.props[prop] === true)

		return (
			<Component className={classNames(
				!box ? styles.message : styles.box,
				type && styles[type],
				className,
			)}>
				{icon && <Icon className={styles.icon} name={icon}/>}
				<div className={styles.text}>
					{children}
				</div>
			</Component>
		)
	}
}
