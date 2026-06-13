import {msg} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'
import {Segment} from 'akkd'
import classNames from 'classnames'
import {NormalisedMessage} from 'components/ui/NormalisedMessage'
import {DisplayMode} from 'parser/core/Analyser'
import {Result} from 'parser/core/Parser'
import {MouseEvent, PureComponent, ReactNode} from 'react'
import ReactDOM from 'react-dom'
import {Button, Header, Icon} from 'semantic-ui-react'
import {gutter} from 'theme'
import styles from './Analyse.module.css'
import {ModuleExpansionProvider} from './ModuleExpansionContext'
import {Consumer, Context, Scrollable} from './SegmentPositionContext'

interface Props {
	index: number
	result: Result
}

interface State {
	collapsed?: boolean
	expanded: boolean
}

export const OFFSET_FROM_VIEWPORT_TOP = gutter
const MODULE_HEIGHT_MAX = 400
const MODULE_HEIGHT_LEEWAY = 200

const expandModuleLabel = msg({id: 'core.analyse.expand-module', message: 'Expand module'})
const collapseModuleLabel = msg({id: 'core.analyse.collapse-module', message: 'Collapse module'})

function ExpansionButton({
	expanded,
	onClick,
}: {
	expanded: boolean
	onClick(event: MouseEvent): void
}) {
	const {i18n} = useLingui()
	const label = i18n._(expanded ? collapseModuleLabel : expandModuleLabel)

	return <Button
		aria-label={label}
		aria-pressed={expanded}
		circular
		compact
		icon={expanded ? 'compress' : 'expand'}
		onClick={onClick}
		size="mini"
		title={label}
	/>
}

export class ResultSegment extends PureComponent<Props, State> implements Scrollable {
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
	private previousBodyOverflow?: string

	constructor(props: Props) {
		super(props)

		this.scrollIntoView.bind(this)

		const state: State = {expanded: false}
		if (props.result.mode === DisplayMode.FULL) {
			state.collapsed = false
		}
		this.state = state
	}

	override componentDidMount() {
		// semantic-ui-react doesn't support refs at all, so we'd either need a wrapping div that's there
		// just to be ref'd, or we need the ReactDOM hacks. We _need_ the element to have a size so we can't
		// just jam it in as a 0-size child that wouldn't cause any trouble.
		// eslint-disable-next-line react/no-find-dom-node
		this.ref = ReactDOM.findDOMNode(this) as HTMLElement
		this.observer.observe(this.ref)

		if (!ResultSegment.instances.has(this.props.result.handle)) {
			ResultSegment.instances.set(this.props.result.handle, this)
		}
	}

	override componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
		if (this.props.index !== prevProps.index) {
			this.positionContext.unregister(prevProps.index)
		}

		// eslint-disable-next-line react/no-find-dom-node
		const ref = ReactDOM.findDOMNode(this) as HTMLElement

		if (ref !== this.ref) {
			if (this.ref != null) {
				this.observer.unobserve(this.ref)
			}
			this.ref = ref
			this.observer.observe(ref)
		}

		if (this.state.expanded !== prevState.expanded) {
			this.syncExpansionSideEffects()
		}
	}

	override componentWillUnmount() {
		if (ResultSegment.instances.get(this.props.result.handle) === this) {
			ResultSegment.instances.delete(this.props.result.handle)
		}

		this.observer.disconnect()
		this.positionContext.unregister(this.props.index)
		this.clearExpansionSideEffects()
	}

	override render() {
		return <Consumer>{value => {
			this.positionContext = value
			return this.renderContent()
		}}</Consumer>
	}

	private renderContent = () => {
		const {result} = this.props
		const {expanded} = this.state

		if (result.mode === DisplayMode.RAW) {
			return <div>{result.markup}</div>
		}

		const titleId = `module-${result.handle}-title`
		const contents = this.renderModuleContents(titleId)

		if (result.mode === DisplayMode.FULL) {
			return this.renderExpansionFrame(
				titleId,
				<Segment className={this.segmentClassName} onClick={expanded ? this.stopExpansionClickPropagation : undefined}>
					{contents}
				</Segment>,
			)
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
			this.renderExpansionFrame(
				titleId,
				<Segment.Expandable
					className={this.segmentClassName}
					collapsed={collapsed}
					forceExpanded={expanded}
					maxHeight={MODULE_HEIGHT_MAX}
					leeway={MODULE_HEIGHT_LEEWAY}
					onClick={expanded ? this.stopExpansionClickPropagation : undefined}
					seeMore={seeMore}
				>
					{contents}
				</Segment.Expandable>,
			)
		)
	}

	private get segmentClassName() {
		return classNames(
			styles.moduleSegment,
			this.state.expanded && styles.expandedSegment,
		)
	}

	private renderExpansionFrame(titleId: string, contents: ReactNode) {
		const {expanded} = this.state

		return (
			<div
				aria-labelledby={expanded ? titleId : undefined}
				aria-modal={expanded || undefined}
				className={classNames(
					styles.moduleExpansionFrame,
					expanded && styles.expanded,
				)}
				onClick={expanded ? this.collapseExpanded : undefined}
				role={expanded ? 'dialog' : undefined}
			>
				<ModuleExpansionProvider value={{expanded}}>
					{contents}
				</ModuleExpansionProvider>
			</div>
		)
	}

	private renderModuleContents(titleId: string) {
		const {result} = this.props

		return <>
			<div className={styles.moduleHeader}>
				<Header id={titleId} className={styles.moduleTitle}>
					{result.name != null
						? <NormalisedMessage message={result.name}/>
						: result.handle
					}
				</Header>
				{this.renderHeaderActions()}
			</div>
			<div>{result.markup}</div>
		</>
	}

	private renderHeaderActions() {
		const {result} = this.props
		if (!result.expandable && result.headerActions == null) { return null }

		return (
			<div className={styles.moduleHeaderActions}>
				{result.headerActions}
				{result.expandable && (
					<ExpansionButton
						expanded={this.state.expanded}
						onClick={this.handleExpansionButtonClick}
					/>
				)}
			</div>
		)
	}

	private handleIntersection(entries: IntersectionObserverEntry[]) {
		for (const entry of entries) {
			const active = entry.boundingClientRect.bottom > OFFSET_FROM_VIEWPORT_TOP
			this.positionContext.register(this, this.props.index, active)
		}
	}

	private toggleExpanded = () => {
		this.setState(({expanded}) => ({expanded: !expanded}))
	}

	private handleExpansionButtonClick = (event: MouseEvent) => {
		event.stopPropagation()
		this.toggleExpanded()
	}

	private stopExpansionClickPropagation = (event: MouseEvent) => {
		event.stopPropagation()
	}

	private collapseExpanded = () => {
		this.setState({expanded: false})
	}

	private handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			this.collapseExpanded()
		}
	}

	private syncExpansionSideEffects() {
		if (this.state.expanded) {
			this.previousBodyOverflow = document.body.style.overflow
			document.body.style.overflow = 'hidden'
			window.addEventListener('keydown', this.handleKeyDown)
			return
		}

		this.clearExpansionSideEffects()
	}

	private clearExpansionSideEffects() {
		window.removeEventListener('keydown', this.handleKeyDown)

		if (this.previousBodyOverflow != null) {
			document.body.style.overflow = this.previousBodyOverflow
			this.previousBodyOverflow = undefined
		}
	}

	scrollIntoView() {
		if (this.ref == null) { return }

		// Try to use the smooth scrolling, fall back to the old method
		const scrollAmount = this.ref.getBoundingClientRect().top - OFFSET_FROM_VIEWPORT_TOP
		try {
			scrollBy({top: scrollAmount, behavior: 'smooth'})
		} catch {
			scrollBy(0, scrollAmount)
		}

		// Make sure the segment is expanded
		this.setState({collapsed: false})
	}
}
