import React from 'react'
import styles from './Message.module.css'

export class MessageHeader extends React.PureComponent {
	render() {
		return (
			<div className={styles.header}>
				{this.props.children}
			</div>
		)
	}
}
