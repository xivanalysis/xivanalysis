import {Event} from 'events'
import _ from 'lodash'
import Module from './Module'

export type FilterPartial<T> = {
	[K in keyof T]?: T[K] extends object
		? FilterPartial<T[K]>
		: FilterPartial<T[K]> | Array<FilterPartial<T[K]>>
}

export type Filter<T extends Event> = FilterPartial<T>

type ModuleHandle = (typeof Module)['handle']

export type EventHookCallback<T extends Event> = (event: T) => void

export interface EventHook<T extends Event> {
	event: T['type']
	filter?: Filter<T>
	module: ModuleHandle // TODO: Should this be the entire module ref?
	callback: EventHookCallback<T>
}

export type TimestampHookCallback = (opts: {timestamp: number}) => void

export interface TimestampHook {
	timestamp: number
	module: ModuleHandle
	callback: TimestampHookCallback
}

type ModuleErrors = Record<ModuleHandle, Error>

export class Dispatcher {
	private _timestamp = 0

	/** The timestamp of the last hook executed. */
	get timestamp() {
		return this._timestamp
	}

	// eventHooks[eventType][moduleHandle]: Set<Hook>
	private eventHooks = new Map<Event['type'], Map<ModuleHandle, Set<EventHook<any>>>>()

	// Stored nearest-last so we can use the significantly-faster pop
	private timestampHookQueue: TimestampHook[] = []

	/**
	 * Register an event hook. The callback provided on the hook will be executed
	 * each time a matching event is dispatched.
	 */
	addEventHook<T extends Event>(hook: EventHook<T>) {
		let eventTypeHooks = this.eventHooks.get(hook.event)
		if (!eventTypeHooks) {
			eventTypeHooks = new Map()
			this.eventHooks.set(hook.event, eventTypeHooks)
		}

		let moduleHooks = eventTypeHooks.get(hook.module)
		if (!moduleHooks) {
			moduleHooks = new Set()
			eventTypeHooks.set(hook.module, moduleHooks)
		}

		moduleHooks.add(hook)
	}

	/**
	 * Remove an existing event hook, preventing it from executing any further.
	 * Removal is performed via strict equality, the hook being removed must have
	 * been explicitly added prior.
	 */
	removeEventHook(hook: EventHook<any>) {
		const eventTypeHooks = this.eventHooks.get(hook.event)
		if (!eventTypeHooks) { return }

		const moduleHooks = eventTypeHooks.get(hook.module)
		if (!moduleHooks) { return }

		moduleHooks.delete(hook)
	}

	/**
	 * Add a hook for a timestamp. The provided callback will be fired a single
	 * time when the parser reaches the specified timestamp. Hooks for a timestamp
	 * in the past will be ignored.
	 */
	addTimestampHook(hook: TimestampHook) {
		// If we're already past this hook's timestamp, do nothing
		if (hook.timestamp < this._timestamp) {
			return
		}

		const index = this.timestampHookQueue.findIndex(qh => qh.timestamp < hook.timestamp)

		if (index === -1) {
			this.timestampHookQueue.push(hook)
		} else {
			this.timestampHookQueue.splice(index, 0, hook)
		}
	}

	/** Remove a previously added timestamp hook. */
	removeTimestampHook(hook: TimestampHook) {
		const index = this.timestampHookQueue.indexOf(hook)
		if (index === -1) { return }
		this.timestampHookQueue.splice(index, 1)
	}

	/** Dispatch hooks for the provided event. */
	dispatch(event: Event, triggerOrder: ModuleHandle[]): ModuleErrors {
		return {
			...this.dispatchTimestamp(event.timestamp, triggerOrder),
			...this.dispatchEvent(event, triggerOrder),
		}
	}

	private dispatchTimestamp(timestamp: number, triggerOrder: ModuleHandle[]) {
		const moduleErrors: ModuleErrors = {}

		// Fire off any timestamp hooks that are ready
		const thq = this.timestampHookQueue
		while (thq.length > 0 && thq[thq.length - 1].timestamp <= timestamp) {
			const hook = thq.pop()!

			// If we're not triggering on this module, skip the hook - removing it entirely
			if (!triggerOrder.includes(hook.module)) { continue }

			this._timestamp = hook.timestamp

			try {
				hook.callback({timestamp: hook.timestamp})
			} catch (error) {
				moduleErrors[hook.module] = error
			}
		}

		return moduleErrors
	}

	private dispatchEvent(event: Event, triggerOrder: ModuleHandle[]) {
		// Update the internal timestamp to the event we're dispatching
		this._timestamp = event.timestamp

		// Get registered hooks for this event type, if there are any
		const eventTypeHooks = this.eventHooks.get(event.type)
		if (!eventTypeHooks) { return }

		// Check for hooks on each of the modules we're triggering events on
		return triggerOrder.reduce(
			(moduleErrors, handle) => {
				const moduleHooks = eventTypeHooks.get(handle)
				if (!moduleHooks) { return moduleErrors }

				try {
					moduleHooks.forEach(hook => {
						// Ensure the hook's filter matches before triggering
						if (hook.filter && !this.checkFilterMatches(event, hook.filter)) {
							return
						}

						hook.callback(event)
					})
				} catch (error) {
					moduleErrors[handle] = error
				}

				return moduleErrors
			},
			{} as ModuleErrors,
		)
	}

	// TODO: Look into using _.isMatchWith for this - it's incorrectly typed in DT at the moment, though.
	private checkFilterMatches<T extends object, F extends FilterPartial<T>>(
		object: T,
		filter: F,
	): boolean {
		return Object.keys(filter).every(key => {
			// If the event doesn't have the key we're looking for, just shortcut out
			if (!object.hasOwnProperty(key)) {
				return false
			}

			// Just trust me 'aite
			const filterVal: any = filter[key as keyof typeof filter]
			const objectVal: any = object[key as keyof typeof object]

			// FFLogs doesn't use arrays inside events themselves, so I'm using them to handle multiple possible values
			if (Array.isArray(filterVal)) {
				return filterVal.includes(objectVal)
			}

			// If it's an object, I need to dig down. Mostly for the `ability` key
			if (typeof filterVal === 'object') {
				return this.checkFilterMatches(objectVal, filterVal)
			}

			// Basic value check
			return filterVal === objectVal
		})
	}
}
