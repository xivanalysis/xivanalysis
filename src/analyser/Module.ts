import {Events} from '@xivanalysis/parser-core'
import _ from 'lodash'

export type Handle = string

interface MappedDependency {
	handle: Handle
	prop: string
}

export const ALL_EVENTS = Symbol('ALL_EVENTS')

type HookEventType<T extends Events.Base> = T['type'] | typeof ALL_EVENTS
export type HookCallback<T extends Events.Base> = (event: T) => void
export interface Hook<T extends Events.Base> {
	event: HookEventType<T>,
	filter: Partial<T>,
	callback: HookCallback<T>,
}

export class Module {
	static dependencies: Array<Handle | MappedDependency> = []

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

	private hooks = new Map<HookEventType<Events.Base>, Set<Hook<Events.Base>>>()

	constructor(opts: {
	}) {
		this.init()
	}

	/**
	 * Called when the module is set up and ready to be used.
	 * This is the ideal place to add any hooks you wish to utilise.
	 */
	protected init() {}

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

	protected removeHook<T extends Events.Base>(hook: Hook<T>) {
		const hooks = this.hooks.get(hook.event)
		if (!hooks) { return }
		hooks.delete(hook as any)
	}

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
}
