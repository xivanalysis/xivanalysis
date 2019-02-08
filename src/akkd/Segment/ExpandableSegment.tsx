import classNames from 'classnames'
import React from 'react'
import styles from './Segment.module.css'

interface Props {
	maxHeight?: number
}

interface State {
	overflowing: boolean
	collapsed: boolean
	maxHeight?: number | 'none'
}

export class ExpandableSegment extends React.PureComponent<Props, State> {
	private ref: React.RefObject<HTMLDivElement>

	constructor(props: Props) {
		super(props)

		this.ref = React.createRef()

		this.state = {
			overflowing: false,
			collapsed: true,
		}
	}

	componentDidMount() {
		const {current} = this.ref
		const {maxHeight} = this.props

		if (!current || !maxHeight) { return }

		// scrollHeight includes overflown content
		// If we're > the max height, we've overflowing
		if (current.scrollHeight > maxHeight) {
			this.setState({overflowing: true})
		}
	}

	expand = () => {
		const {current} = this.ref
		if (!current) { return }

		current.addEventListener('transitionend', this.onTransitionEnd)

		this.setState({
			collapsed: false,
			maxHeight: current.scrollHeight,
		})
	}

	onTransitionEnd = () => {
		const {current} = this.ref
		if (!current) { return }

		current.removeEventListener('transitionend', this.onTransitionEnd)

		this.setState({
			maxHeight: 'none',
		})
	}

	render() {
		const {maxHeight: propHeight, children} = this.props
		const {overflowing, collapsed, maxHeight: stateHeight} = this.state

		const maxHeight = collapsed? propHeight : stateHeight

		const style: React.CSSProperties = {}
		if (maxHeight) {
			style.maxHeight = maxHeight
		}

		return (
			<div
				ref={this.ref}
				className={classNames(
					styles.segment,
					maxHeight && styles.expandable,
				)}
				style={style}
			>
				{children}
				{overflowing && collapsed && (
					<div className={styles.expand} onClick={this.expand}>
						<span className={styles.expandMarker}>Expand</span>
					</div>
				)}
			</div>
		)
	}
}
