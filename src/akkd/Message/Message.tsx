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
}

const typePrecedence: ReadonlyArray<keyof MessageTypes> = [
	'error',
	'warning',
	'info',
	'success',
]

interface Props extends MessageTypes {
	// TODO: Replace with straight FA once we rip SUI out
	icon?: SemanticICONS
}

export class Message extends React.PureComponent<Props> {
	static Header = MessageHeader

	render() {
		const {icon, children} = this.props

		// Find the first message type that's truthy
		const type = typePrecedence.find(prop => this.props[prop] === true)

		return (
			<div className={classNames(
				styles.message,
				type && styles[type],
			)}>
				{icon && <Icon className={styles.icon} name={icon}/>}
				<div>
					{children}
				</div>
			</div>
		)
	}
}
