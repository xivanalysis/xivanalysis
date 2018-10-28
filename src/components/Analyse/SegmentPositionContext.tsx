import React from 'react'

export interface Scrollable {
	scrollIntoView(): void
}

export interface Context {
	active: number|null
	register(scrollable: Scrollable, id: number, state: boolean): void
	unregister(id: number): void
	scrollToId(id?: number): void
}

const context = React.createContext<Context>(undefined as never)
export const {Consumer} = context

interface ProviderState extends Context {
	registry: ReadonlyMap<number, boolean>
}

export class SegmentPositionProvider extends React.PureComponent<{}, ProviderState> {
	readonly state: Readonly<ProviderState> = {
		active: null,
		register: this.register.bind(this),
		unregister: this.unregister.bind(this),
		scrollToId: this.scrollToId.bind(this),
		registry: new Map(),
	}
	private readonly refMap = new Map<number, { scrollIntoView(): void }>()

	componentDidUpdate(_prevProps: Readonly<{}>, prevState: Readonly<ProviderState>) {
		const {registry} = this.state
		if (registry !== prevState.registry) {
			const toCheck = Array.from(registry.keys()).sort()
			const activeId = toCheck.find(id => registry.get(id)!)
			const active = activeId !== undefined ? activeId : (
				toCheck.length > 0 ? toCheck[toCheck.length - 1] : null
			)

			if (active !== this.state.active) {
				this.setState({active})
			}
		}
	}

	render() {
		return <context.Provider value={this.state}>{this.props.children}</context.Provider>
	}

	private register(scrollable: Scrollable, id: number, state: boolean) {
		if (this.state.registry.get(id) === state) { return }
		this.refMap.set(id, scrollable)
		this.setState({
			registry: new Map(this.state.registry).set(id, state),
		})
	}

	private unregister(id: number) {
		if (!this.state.registry.has(id)) { return }
		this.refMap.delete(id)
		const registry = new Map(this.state.registry)
		registry.delete(id)
		this.setState({registry})
	}

	private scrollToId(id: number|undefined = this.state.active || undefined) {
		if (id === undefined) { return }
		const ref = this.refMap.get(id)
		if (ref === undefined) { return }
		ref.scrollIntoView()
	}
}
