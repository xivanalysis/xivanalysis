import {Event} from 'event'
import {Injectable} from './Injectable'

type Handle = (typeof Injectable)['handle']

/** Signature of event filter predicate functions. */
export type EventFilterPredicate<T extends Event> = (event: Event) => event is T

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

/**
 * Dispatcher is in charge of consuming events from the parser and fanning them
 * out to matching hooks where required.
 */
export class Dispatcher {
	private _timestamp = 0
	/** The timestamp of the hook currently being executed. */
	get timestamp() { return this._timestamp }

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private eventHooks = new Map<Handle, Set<EventHook<any>>>()

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
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const hook = queue.pop()!

			// If we're not trigering on this module, skip the hook. This effectively removes it.
			// TODO: This is pretty naive, and doesn't actually respect trigger _order_.
			//       Ideally, should be grouped by timestamp and executed in handle order.
			if (!handles.includes(hook.handle)) { continue }

			this._timestamp = hook.timestamp

			try {
				hook.callback({timestamp: hook.timestamp})
			} catch (error) {
				issues.push({handle: hook.handle, error})
			}
		}

		return issues
	}

	private dispatchEvent(event: Event, handles: Handle[]) {
		this._timestamp = event.timestamp

		const issues: DispatchIssue[] = []

		// Iterate over the handles provided, looking for registered hooks
		for (const handle of handles) {
			const handleHooks = this.eventHooks.get(handle)
			if (handleHooks == null) { continue }

			try {
				// Try to execute any matching hooks for the current handle
				for (const hook of handleHooks.values()) {
					if (!hook.predicate(event)) { continue }
					hook.callback(event)
				}
			} catch (error) {
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
		let handleHooks = this.eventHooks.get(hook.handle)
		if (handleHooks == null) {
			handleHooks = new Set()
			this.eventHooks.set(hook.handle, handleHooks)
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
		const handleHooks = this.eventHooks.get(hook.handle)
		if (handleHooks == null) { return false }

		return handleHooks.delete(hook)
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
