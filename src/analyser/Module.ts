import {MessageDescriptor} from '@lingui/core'
import {Events} from '@xivanalysis/parser-core'
import _ from 'lodash'
import {Analyser} from './Analyser'

export type Handle = string

interface MappedDependency {
	handle: Handle
	prop: string
}

type HookEventType<T extends Events.Base> = T['type'] | typeof ALL_EVENTS
export type HookCallback<T extends Events.Base> = (event: T) => void
export interface Hook<T extends Events.Base> {
	event: HookEventType<T>
	filter: Partial<T>
	callback: HookCallback<T>
}

export const ALL_EVENTS = Symbol('ALL_EVENTS')

export enum DISPLAY_ORDER {
	TOP = 0,
	DEFAULT = 50,
	BOTTOM = 100,
}

export enum DISPLAY_MODE {
	COLLAPSIBLE,
	FULL,
	/** Don't use this unless you know what you're doing, and you've run it past me. */
	RAW,
}

export class Module {
	static dependencies: Array<Handle | MappedDependency> = []
	static displayOrder: number = DISPLAY_ORDER.DEFAULT
	static displayMode: DISPLAY_MODE

	private static _handle: Handle
	static get handle() {
		if (!this._handle) {
			throw new Error(`Module \`${this.name}\` does not have a handle.`)
		}
		return this._handle
	}
	static set handle(value) {
		this._handle = value
	}
	get handle() {
		return (this.constructor as typeof Module).handle
	}

	private static _title: string | MessageDescriptor
	static get title() {
		if (!this._title) {
			this._title = this.handle.charAt(0).toUpperCase() + this.handle.slice(1)
		}
		return this._title
	}
	static set title(value) {
		this._title = value
	}
	get title() {
		return (this.constructor as typeof Module).title
	}

	private hooks = new Map<HookEventType<Events.Base>, Set<Hook<Events.Base>>>()

	protected analyser: Analyser

	constructor(opts: {
		analyser: Analyser,
		modules: Map<string, Module>,
	}) {
		this.analyser = opts.analyser

		// Set up the dependencies
		const module = this.constructor as typeof Module
		module.dependencies.forEach(dep => {
			const mappedDep = typeof dep === 'string'
				? {handle: dep, prop: dep}
				: dep

			// believe in the me that believes in typescript
			const lmao = this as any
			lmao[mappedDep.prop] = opts.modules.get(mappedDep.handle)
		})

		this.init()
	}

	/**
	 * Called when the module is set up and ready to be used.
	 * This is the ideal place to add any hooks you wish to utilise.
	 */
	protected init() {}

	/**
	 * Register an event hook. The callback provided will be called for each instance
	 * of the specified event in the set of analysed events. A filter can be provided
	 * to reduce the scope of events recieved to only those matching it.
	 */
	protected addHook<T extends Events.Base>(
		event: HookEventType<T>,
		callback: HookCallback<T>,
	): Hook<T>
	protected addHook<T extends Events.Base>(
		event: HookEventType<T>,
		filter: Partial<T>,
		callback: HookCallback<T>,
	): Hook<T>
	protected addHook<T extends Events.Base>(
		event: HookEventType<T>,
		filterArg: Partial<T> | HookCallback<T>,
		cbArg?: HookCallback<T>,
	): Hook<T> {
		// Normalise the parameters
		const callback = typeof filterArg === 'function'? filterArg : cbArg
		const filter: Partial<T> = typeof filterArg === 'function'? {} : filterArg

		// If there's no CB just tell 'em off because wat
		if (!callback) {
			throw new Error('No callback provided for hook.')
		}

		// TODO: Filter QoL?

		// Build the hook
		const hook: Hook<T> = {
			event,
			filter,
			callback: callback.bind(this),
		}

		// Register the hook
		let hooks = this.hooks.get(event)
		if (!hooks) {
			hooks = new Set()
			this.hooks.set(event, hooks)
		}
		hooks.add(hook as any) // get fucked ts

		// Return the hook so they can remove it later
		return hook
	}

	/** Remove a previously added hook. */
	protected removeHook<T extends Events.Base>(hook: Hook<T>) {
		const hooks = this.hooks.get(hook.event)
		if (!hooks) { return }
		hooks.delete(hook as any)
	}

	/** @internal */
	triggerEvent<T extends Events.Base>(event: T) {
		this.runHooks(event, this.hooks.get(ALL_EVENTS))
		this.runHooks(event, this.hooks.get(event.type))
	}

	private runHooks<T extends Events.Base>(event: T, hooks?: Set<Hook<T>>) {
		if (!hooks) { return }
		hooks.forEach(hook => {
			// Check the filter
			if (!_.isMatch(event, hook.filter)) { return }

			hook.callback(event)
		})
	}

	output(): React.ReactNode {
		return null
	}
}
