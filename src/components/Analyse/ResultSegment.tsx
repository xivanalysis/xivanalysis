import React from 'react'
import ReactDOM from 'react-dom'

import {Trans} from '@lingui/react'
import {
	Header,
	Segment,
} from 'semantic-ui-react'

import {Result} from 'parser/core/Parser'

import {Consumer, Context, Scrollable} from './SegmentPositionContext'

interface Props {
	index: number
	result: Result
}

export const OFFSET_FROM_VIEWPORT_TOP = 50

export default class ResultSegment extends React.PureComponent<Props> implements Scrollable {
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
		const {result} = this.props
		return <Consumer>{value => {
			this.positionContext = value
			return <Segment vertical id={result.name}>
				<Header><Trans id={result.i18n_id} defaults={result.name} /></Header>
				{result.markup}
			</Segment>
		}}</Consumer>
	}

	private handleIntersection(entries: IntersectionObserverEntry[]) {
		for (const entry of entries) {
			const active = entry.boundingClientRect.bottom > OFFSET_FROM_VIEWPORT_TOP
			this.positionContext.register(this, this.props.index, active)
		}
	}

	scrollIntoView() {
		// there actually is a this.ref!.scrollIntoView method, but it doesn't support offsets
		scrollBy({
			top: this.ref!.getBoundingClientRect().top - OFFSET_FROM_VIEWPORT_TOP,
			behavior: 'smooth',
		})
	}
}
