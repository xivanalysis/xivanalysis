import React from 'react'
import styles from './Segment.module.css'

export class Segment extends React.PureComponent {
	render() {
		const {children} = this.props
		return <div className={styles.segment}>{children}</div>
	}
}
