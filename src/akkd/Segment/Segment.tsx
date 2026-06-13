import classNames from 'classnames'
import {MouseEventHandler, PureComponent, ReactNode} from 'react'
import {ExpandableSegment} from './ExpandableSegment'
import styles from './Segment.module.css'

interface SegmentProps {
	className?: string
	onClick?: MouseEventHandler<HTMLDivElement>
	children?: ReactNode
}

export class Segment extends PureComponent<SegmentProps> {
	static Expandable = ExpandableSegment

	override render() {
		const {children, className, onClick} = this.props
		return <div className={classNames(styles.segment, className)} onClick={onClick}>{children}</div>
	}
}
