import React from 'react'
import ReactDOM from 'react-dom'

import {Trans} from '@lingui/react'
import {
	Header,
	Segment,
} from 'semantic-ui-react'

import {ParserResult} from 'parser/core/Parser'

import {Consumer, Context, Scrollable} from './SegmentPositionContext'

interface Props {
	index: number
	result: ParserResult
}

export const OFFSET_FROM_VIEWPORT_TOP = 50

export default class ResultSegment extends React.PureComponent<Props> implements Scrollable {
	private readonly observer = new IntersectionObserver(this.handleIntersection.bind(this), {
		rootMargin: `${-OFFSET_FROM_VIEWPORT_TOP}px 0px 0px 0px`,
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
			const active = entry.boundingClientRect.bottom >= OFFSET_FROM_VIEWPORT_TOP
			this.positionContext.register(this, this.props.index, active)
		}
	}

	scrollIntoView() {
		// there actually is a this.ref!.scrollIntoView method, but it doesn't support offsets
		scrollBy({
			// the "+ 1" is needed to actually nudge it enough that the intersection observer detects it
			// the alternative is to change the ">=" in handleIntersection with a ">"
			top: this.ref!.getBoundingClientRect().top - OFFSET_FROM_VIEWPORT_TOP + 1,
			behavior: 'smooth',
		})
	}
}
