import {Trans} from '@lingui/react'
import {Segment} from 'akkd'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {DISPLAY_MODE} from 'parser/core/Module'
import {Result} from 'parser/core/Parser'
import React from 'react'
import ReactDOM from 'react-dom'
import {Header, Icon} from 'semantic-ui-react'
import {gutter} from 'theme'
import styles from './Analyse.module.css'
import {Consumer, Context, Scrollable} from './SegmentPositionContext'

interface Props {
	index: number
	result: Result
}

interface State {
	collapsed?: boolean
}

export const OFFSET_FROM_VIEWPORT_TOP = gutter
const MODULE_HEIGHT_MAX = 400
const MODULE_HEIGHT_LEEWAY = 200

export default class ResultSegment extends React.PureComponent<Props, State> implements Scrollable {
	private static instances = new Map<string, ResultSegment>()
	public static scrollIntoView(handle: string) {
		const instance = this.instances.get(handle)
		if (instance !== undefined) {
			instance.scrollIntoView()
		}
	}

	private readonly observer = new IntersectionObserver(this.handleIntersection.bind(this), {
		rootMargin: `${-(OFFSET_FROM_VIEWPORT_TOP + 1)}px 0px 0px 0px`,
	})
	private ref: HTMLElement|null = null
	private positionContext!: Context

	constructor(props: Props) {
		super(props)

		this.scrollIntoView.bind(this)

		const state: State = {}
		if (props.result.mode === DISPLAY_MODE.FULL) {
			state.collapsed = false
		}
		this.state = state
	}

	componentDidMount() {
		// semantic-ui-react doesn't support refs at all, so we'd either need a wrapping div that's there
		// just to be ref'd, or we need the ReactDOM hacks. We _need_ the element to have a size so we can't
		// just jam it in as a 0-size child that wouldn't cause any trouble.
		this.ref = ReactDOM.findDOMNode(this) as HTMLElement
		this.observer.observe(this.ref)

		if (!ResultSegment.instances.has(this.props.result.handle)) {
			ResultSegment.instances.set(this.props.result.handle, this)
		}
	}

	componentDidUpdate(prevProps: Readonly<Props>) {
		if (this.props.index !== prevProps.index) {
			this.positionContext.unregister(prevProps.index)
		}

		const ref = ReactDOM.findDOMNode(this) as HTMLElement

		if (ref !== this.ref) {
			this.observer.unobserve(this.ref!)
			this.ref = ref
			this.observer.observe(ref)
		}
	}

	componentWillUnmount() {
		if (ResultSegment.instances.get(this.props.result.handle) === this) {
			ResultSegment.instances.delete(this.props.result.handle)
		}

		this.observer.disconnect()
		this.positionContext.unregister(this.props.index)
	}

	render() {
		return <Consumer>{value => {
			this.positionContext = value
			return this.renderContent()
		}}</Consumer>
	}

	private renderContent = () => {
		const {result} = this.props

		if (result.mode === DISPLAY_MODE.RAW) {
			return <div>{result.markup}</div>
		}

		const contents = <>
			<Header><NormalisedMessage message={result.name} id={result.i18n_id}/></Header>
			<div>{result.markup}</div>
		</>

		if (result.mode === DISPLAY_MODE.FULL) {
			return <Segment>{contents}</Segment>
		}

		const {collapsed} = this.state
		const seeMore = <>
			<Icon name="chevron down"/>
			<strong className={styles.seeMore}>
				<Trans id="core.analyse.see-more">See more</Trans>
			</strong>
			<Icon name="chevron down"/>
		</>

		return (
			<Segment.Expandable
				collapsed={collapsed}
				maxHeight={MODULE_HEIGHT_MAX}
				leeway={MODULE_HEIGHT_LEEWAY}
				seeMore={seeMore}
			>
				{contents}
			</Segment.Expandable>
		)
	}

	private handleIntersection(entries: IntersectionObserverEntry[]) {
		for (const entry of entries) {
			const active = entry.boundingClientRect.bottom > OFFSET_FROM_VIEWPORT_TOP
			this.positionContext.register(this, this.props.index, active)
		}
	}

	scrollIntoView() {
		// Try to use the smooth scrolling, fall back to the old method
		const scrollAmount = this.ref!.getBoundingClientRect().top - OFFSET_FROM_VIEWPORT_TOP
		try {
			scrollBy({top: scrollAmount, behavior: 'smooth'})
		} catch {
			scrollBy(0, scrollAmount)
		}

		// Make sure the segment is expanded
		this.setState({collapsed: false})
	}
}
