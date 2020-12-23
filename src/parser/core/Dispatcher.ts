import {Event} from 'event'
import {Injectable} from './Injectable'

type Handle = (typeof Injectable)['handle']

/**
 * Representation of filter object, used by the dispatcher to determine if a
 * hook should be executed.
 */
export interface EventFilter<T extends Event> {
	/**
	 * Execute the filter to determine if the related hook should be executed.
	 *
	 * @param event The event to test against.
	 * @return `true` for a matching filter, `false` otherwise.
	 */
	execute: (event: T) => boolean
}

/** Type of callbacks on event hooks. */
export type EventHookCallback<T extends Event> = (event: T) => void

/** Configuration for an event hook. */
export interface EventHook<T extends Event> {
	filter: EventFilter<T>
	handle: Handle
	callback: EventHookCallback<T>
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

	private eventHooks = new Map<Handle, Set<EventHook<any>>>()

	/**
	 * Dispatch an event.
	 *
	 * @param event The event to dispatch.
	 * @param handles An array of hook handles that should be considered for dispatch.
	 * @return Array of issues that occured during dispatch.
	 */
	dispatch(event: Event, handles: Handle[]): DispatchIssue[] {
		// TODO: timestamp hooks?
		return this.dispatchEvent(event, handles)
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
					if (!hook.filter.execute(event)) { continue }
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
	 * Remove a registered hook, preventing it from executing further. Hook
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
}
