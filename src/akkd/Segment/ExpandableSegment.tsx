import classNames from 'classnames'
import React from 'react'
import styles from './Segment.module.css'

interface Props {
	seeMore?: React.ReactNode
	collapsed?: boolean
	maxHeight?: number
	leeway?: number
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
			collapsed: props.collapsed !== undefined? props.collapsed : true,
		}
	}

	componentDidMount() {
		const {current} = this.ref
		const {
			maxHeight,
			leeway = 0,
		} = this.props

		if (!current || !maxHeight) { return }

		// scrollHeight includes overflown content
		if (current.scrollHeight > maxHeight + leeway) {
			this.setState({overflowing: true})
		}
	}

	componentDidUpdate(prevProps: Props, prevState: State) {
		// Animate the expand the first time it's requested
		if (
			prevProps.collapsed !== false &&
			this.props.collapsed === false &&
			this.state.collapsed !== false
		) {
			this.expand()
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
		const {
			seeMore,
			maxHeight: propHeight,
			children,
		} = this.props
		const {
			overflowing,
			collapsed,
			maxHeight: stateHeight,
		} = this.state

		const maxHeight = collapsed? propHeight : stateHeight

		const style: React.CSSProperties = {}
		if (maxHeight && overflowing) {
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
						<span className={styles.expandMarker}>{seeMore || 'See more'}</span>
					</div>
				)}
			</div>
		)
	}
}
