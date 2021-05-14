import React, {ReactNode} from 'react'
import styles from './Message.module.css'

interface MessageHeaderProps {
	children?: ReactNode
}

export class MessageHeader extends React.PureComponent<MessageHeaderProps> {
	override render() {
		return (
			<div className={styles.header}>
				{this.props.children}
			</div>
		)
	}
}
