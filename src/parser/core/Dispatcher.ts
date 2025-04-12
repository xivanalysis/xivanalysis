import {Event} from 'event'
import {Injectable} from './Injectable'

type Handle = (typeof Injectable)['handle']

export const FILTER_TYPE = Symbol('filter.type')

/** Signature of event filter predicate functions. */
export type EventFilterPredicate<T extends Event> = {
	(event: Event): event is T
	/** If set, will be used to bucket the predicate as a first-pass optimisation. */
	[FILTER_TYPE]?: string,
}

/** Callback signature for event hooks. */
export type EventHookCallback<T extends Event> = (event: T) => void

/** Configuration for an event hook. */
export interface EventHook<T extends Event> {
	handle: Handle
	predicate: EventFilterPredicate<T>
	callback: EventHookCallback<T>
}

/** Arguments passed to the callback for a timestamp hook. */
export interface TimestampHookArguments {
	/** Timestamp of the execution of this hook, in milliseconds. */
	timestamp: number
}

/** Callback signature for timestamp hooks. */
export type TimestampHookCallback = (opts: TimestampHookArguments) => void

/** Configuration for a timestamp hook */
export interface TimestampHook {
	handle: Handle
	timestamp: number
	callback: TimestampHookCallback
}

/** An issue that occured during dispatch. */
export interface DispatchIssue {
	handle: Handle,
	error: Error
}

export interface Dispatcher {
	readonly timestamp: number
	dispatch(event: Event, handles: Handle[]): DispatchIssue[]
	addEventHook<T extends Event>(hook: EventHook<T>): void
	removeEventHook<T extends Event>(hook: EventHook<T>): boolean
	addTimestampHook(hook: TimestampHook): void
	removeTimestampHook(hook: TimestampHook): boolean
}

/**
 * Dispatcher is in charge of consuming events from the parser and fanning them
 * out to matching hooks where required.
 */
export class DispatcherImpl implements Dispatcher {
	private _timestamp = 0
	/** The timestamp of the hook currently being executed. */
	get timestamp() { return this._timestamp }

	private eventHooks = new Map<
		Handle,
		Map<
			string | undefined,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			Set<EventHook<any>>
		>
	>()

	// Stored nearest-last so we can use the significantly-faster pop
	private timestampHookQueue: TimestampHook[] = []

	/**
	 * Dispatch an event.
	 *
	 * @param event The event to dispatch.
	 * @param handles An array of hook handles that should be considered for dispatch.
	 * @return Array of issues that occured during dispatch.
	 */
	dispatch(event: Event, handles: Handle[]): DispatchIssue[] {
		return [
			...this.dispatchTimestamp(event.timestamp, handles),
			...this.dispatchEvent(event, handles),
		]
	}

	private dispatchTimestamp(timestamp: number, handles: Handle[]) {
		const issues: DispatchIssue[] = []

		// Execute any timestamp hooks that are ready to execute
		const queue = this.timestampHookQueue
		while (queue.length > 0 && queue[queue.length - 1].timestamp <= timestamp) {
			// Enforced by the while loop.
			const hook = queue.pop()!

			// If we're not trigering on this module, skip the hook. This effectively removes it.
			// TODO: This is pretty naive, and doesn't actually respect trigger _order_.
			//       Ideally, should be grouped by timestamp and executed in handle order.
			if (!handles.includes(hook.handle)) { continue }

			this._timestamp = hook.timestamp

			try {
				hook.callback({timestamp: hook.timestamp})
			} catch (error) {
				if (!(error instanceof Error)) {
					throw error
				}

				issues.push({handle: hook.handle, error})
			}
		}

		return issues
	}

	private dispatchEvent(event: Event, handles: Handle[]) {
		this._timestamp = event.timestamp

		const issues: DispatchIssue[] = []

		const typeKeys = [event.type, undefined]

		// Iterate over the handles provided, looking for registered hooks
		for (const handle of handles) {
			const handleHooks = this.eventHooks.get(handle)
			if (handleHooks == null) { continue }

			try {
				// Try to execute any matching hooks for the current handle
				for (const typeKey of typeKeys) {
					const handleTypes = handleHooks.get(typeKey)
					if (handleTypes == null) {
						continue
					}
					for (const hook of handleTypes.values()) {
						if (!hook.predicate(event)) { continue }
						hook.callback(event)
					}
				}
			} catch (error) {
				if (!(error instanceof Error)) {
					throw error
				}

				// If there was an error in any, stop immediately & report
				issues.push({handle, error})
				continue
			}
		}

		return issues
	}

	/**
	 * Add a new event hook. The provided callback will be executed with any
	 * events matching the specified filter.
	 *
	 * @param hook The hook to register.
	 */
	addEventHook<T extends Event>(hook: EventHook<T>) {
		let handleTypes = this.eventHooks.get(hook.handle)
		if (handleTypes == null) {
			handleTypes = new Map()
			this.eventHooks.set(hook.handle, handleTypes)
		}

		const filterType = hook.predicate[FILTER_TYPE]
		let handleHooks = handleTypes.get(filterType)
		if (handleHooks == null) {
			handleHooks = new Set()
			handleTypes.set(filterType, handleHooks)
		}

		handleHooks.add(hook)
	}

	/**
	 * Remove a registered event hook, preventing it from executing further. Hook
	 * registration is checked via strict equality.
	 *
	 * @param hook The hook to remove.
	 * @return `true` if the hook was removed successfully.
	 */
	removeEventHook<T extends Event>(hook: EventHook<T>): boolean {
		const handleTypes = this.eventHooks.get(hook.handle)
		if (handleTypes == null) { return false }

		const filterType = hook.predicate[FILTER_TYPE]
		const handleHooks = handleTypes.get(filterType)
		if (handleHooks == null) { return false }

		const removed = handleHooks.delete(hook)
		if (!removed) { return false }

		if (handleHooks.size === 0) {
			handleTypes.delete(filterType)
		}

		return true
	}

	/**
	 * Add a new timestamp hook. The provided callback will be executed a single
	 * time once the dispatcher reaches the specified timestamp. Hooks for
	 * timestamps in the past will be ignored.
	 *
	 * @param hook The hook to register.
	 */
	addTimestampHook(hook: TimestampHook) {
		// If the hook is in the past, do nothing
		if (hook.timestamp < this._timestamp) {
			return
		}

		// Splice the event into the queue
		const index = this.timestampHookQueue.findIndex(
			queueHook => queueHook.timestamp < hook.timestamp,
		)
		if (index === -1) {
			this.timestampHookQueue.push(hook)
		} else {
			this.timestampHookQueue.splice(index, 0, hook)
		}
	}

	/**
	 * Remove a registered timestamp hook, preventing it from executing. Hook
	 * registration is checked via strict equality.
	 *
	 * @param hook The hook to remove.
	 * @return `true` if the hook was removed successfully.
	 */
	removeTimestampHook(hook: TimestampHook): boolean {
		const index = this.timestampHookQueue.indexOf(hook)
		if (index === -1) { return false }

		this.timestampHookQueue.splice(index, 1)
		return true
	}
}
