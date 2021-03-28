import React, {ReactNode} from 'react'
import {ExpandableSegment} from './ExpandableSegment'
import styles from './Segment.module.css'

interface SegmentProps {
	children?: ReactNode
}

export class Segment extends React.PureComponent<SegmentProps> {
	static Expandable = ExpandableSegment

	render() {
		const {children} = this.props
		return <div className={styles.segment}>{children}</div>
	}
}
