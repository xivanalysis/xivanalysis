import classNames from 'classnames'
import {createRef, CSSProperties, PureComponent, ReactNode, RefObject} from 'react'
import styles from './Segment.module.css'

interface Props {
	seeMore?: ReactNode
	collapsed?: boolean
	maxHeight?: number
	leeway?: number
	children?: ReactNode
}

interface State {
	overflowing: boolean
	collapsed: boolean
	maxHeight?: number | 'none'
}

export class ExpandableSegment extends PureComponent<Props, State> {
	private ref: RefObject<HTMLDivElement>

	constructor(props: Props) {
		super(props)

		this.ref = createRef()

		this.state = {
			overflowing: false,
			collapsed: props.collapsed !== undefined? props.collapsed : true,
		}
	}

	override componentDidMount() {
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

	override componentDidUpdate(prevProps: Props) {
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

	override render() {
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

		const style: CSSProperties = {}
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
