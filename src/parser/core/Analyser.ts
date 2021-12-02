import {MessageDescriptor} from '@lingui/core'
import {Event} from 'event'
import _ from 'lodash'
import {Compute} from 'utilities'
import {EventFilterPredicate, EventHook, EventHookCallback, TimestampHook, TimestampHookCallback} from './Dispatcher'
import {Injectable} from './Injectable'
import Parser from './Parser'

const DEFAULT_DISPLAY_ORDER = 50

export enum DisplayOrder {
	TOP = 0,
	DEFAULT = 50,
	BOTTOM = 100,
}

export enum DisplayMode {
	COLLAPSIBLE,
	FULL,
	/** Don't use this unless you know what you're doing, and you've run it past me. */
	RAW,
}

/** Resolve F to a Partial<Event> if it is a plain string type. */
type ResolveType<F> =
	F extends string
		? {type: F}
		: F

/** For the given type T, remove optional marking on all properties recursively. */
// This is a pretty naive implementation - use something like ts-toolbelt if required.
type DeepRequired<T> = {
	[K in keyof T]-?: DeepRequired<T[K]>
}

/** For the given union U, filter to entries that match F structurally */
// Outer `U extends unknown` is used to force distribution over the union.
// Using `DeepRequired` to remove optionals from the union entry, as `{a?: string}` does not extend `{a: string}`
type FilterUnion<U, F> =
	U extends unknown
		? DeepRequired<U> extends F
			? U
			: never
		: never

/** Builds a predicate function that will filter to events that match the provided partial. */
const buildFilterPredicate = <T extends Event>(filter: Partial<Event>) =>
	_.matches(filter) as EventFilterPredicate<T>

export type AnalyserOptions = ConstructorParameters<typeof Analyser>

export class Analyser extends Injectable {
	private static _title?: string | MessageDescriptor
	/**
	 * Title displayed above analysis output, and in the sidebar. If omitted, a
	 * title cased version of the handle will be used.
	 */
	static get title() {
		return this._title != null
			? this._title
			: _.startCase(this.handle)
	}
	static set title(value) {
		this._title = value
	}

	/**
	 * Value used to control the order in which output is displayed in the results
	 * view. Lower numbers are rendered closer to the top of the page. Typical
	 * range spans 0 - 100.
	 */
	static displayOrder = DEFAULT_DISPLAY_ORDER
	/** The style of the wrapper that analysis output should be rendered in. */
	static displayMode = DisplayMode.COLLAPSIBLE

	/** The parser for the current analysis. */
	protected readonly parser: Parser

	constructor(parser: Parser) {
		super({container: parser.container})

		// Save reference to the parser for later use
		this.parser = parser
	}

	/**
	 * Called when the analyser has been successfully instantiated and configured,
	 * before any analysis is run. This is the recommended location to configure hooks.
	 */
	initialise() { /* noop */ }

	/**
	 * Called at the end of an analysis run to retrieve any output that should be rendered to the
	 * results view. Omit or return `null` to prevent the analyser from being displayed.
	 */
	output?(): React.ReactNode

	// -----
	// #region Hook management
	// -----

	/**
	 * Add a new event hook. The provided callback will be executed with any
	 * events matching the specified filter.
	 *
	 * @param filter
	 * Filter used to determine what events the callback should be called with.
	 * May be one of:
	 * - event type - will filter to events with the specified type
	 * - partial event object - will filter to events matching the specified shape
	 * - predicate function - will filter to events for which the function returns `true`
	 * @param callback Function called with any parsed events matching the filter.
	 * @returns Hook object. Hook objects should be considered a black box value.
	 */
	protected addEventHook<
		F extends Event['type'] | Partial<Event>,
		G extends Event,
		R extends Compute<FilterUnion<Event, ResolveType<F> & G> & ResolveType<F>>,
	>(
		filter: F | EventFilterPredicate<G>,
		callback: EventHookCallback<R>,
	): EventHook<R> {
		// Resolve the filter parameter down to a predicate function for use in the hook
		const resolvedType = typeof filter === 'string'
			? {type: filter}
			: filter

		const predicate = typeof resolvedType === 'function'
			? resolvedType as unknown as EventFilterPredicate<R>
			: buildFilterPredicate<R>(resolvedType as Partial<Event>)

		// Build & add the hook to the dispatcher
		const hook: EventHook<R> = {
			predicate,
			handle: (this.constructor as typeof Analyser).handle,
			callback: callback.bind(this),
		}

		this.parser.dispatcher.addEventHook(hook)

		// Return the hook - can be used to remove later down the line.
		return hook
	}

	/**
	 * Remove a registered event hook, preventing it from executing further. Hook
	 * registration is checked via strict equality.
	 *
	 * @param hook The hook to remove.
	 * @returns `true` if hook was removed successfully.
	 */
	protected removeEventHook<T extends Event>(hook: EventHook<T>) {
		return this.parser.dispatcher.removeEventHook(hook)
	}

	/**
	 * Add a new timestamp hook. The provided callback will be executed a single
	 * time once the dispatcher reaches the specified timestamp. Hooks for
	 * timestamps in the past will be ignored.
	 *
	 * @param timestamp Timestamp the callback should be called at.
	 * @param callback Function called at the specified timestamp.
	 * @returns Hook object. Hook objects should be considered a black box value.
	 */
	protected addTimestampHook(timestamp: number, callback: TimestampHookCallback): TimestampHook {
		const hook: TimestampHook = {
			handle: (this.constructor as typeof Analyser).handle,
			timestamp,
			callback: callback.bind(this),
		}
		this.parser.dispatcher.addTimestampHook(hook)
		return hook
	}

	/**
	 * Remove a registered timestamp hook, preventing it from executing. Hook
	 * registration is checked via strict equality.
	 *
	 * @param hook The hook to remove.
	 * @returns `true` if hook was removed successfully.
	 */
	protected removeTimestampHook(hook: TimestampHook): boolean {
		return this.parser.dispatcher.removeTimestampHook(hook)
	}

	// -----
	// #endregion
	// -----
}
