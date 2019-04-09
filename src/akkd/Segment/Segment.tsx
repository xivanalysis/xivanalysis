import React from 'react'
import {ExpandableSegment} from './ExpandableSegment'
import styles from './Segment.module.css'

export class Segment extends React.PureComponent {
	static Expandable = ExpandableSegment

	render() {
		const {children} = this.props
		return <div className={styles.segment}>{children}</div>
	}
}
