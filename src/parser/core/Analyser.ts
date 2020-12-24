import {Event} from 'event'
import _ from 'lodash'
import {EventFilterPredicate, EventHook, EventHookCallback} from './Dispatcher'
import {Injectable} from './Injectable'
import Module from './Module'
import Parser from './Parser'

/** Resolve F to a Partial<Event> if it is a plain string type. */
type ResolveType<F> =
	F extends string
		? {type: F}
		: F

/** For the given union U, filter to entries that extend F. */
type FilterUnion<U, F> =
	U extends F
		? U
		: never

/** Builds a predicate function that will filter to events that match the provided partial. */
const buildFilterPredicate = <T extends Event>(filter: Partial<Event>) =>
	_.matches(filter) as EventFilterPredicate<T>

export class Analyser extends Injectable {
	/** The parser for the current analysis. */
	protected readonly parser: Parser

	constructor(parser: Parser) {
		super({container: parser.container})

		// Save reference to the parser for later use
		this.parser = parser

		// Due to dispatch order, analysers must _never_ depend on modules, but the
		// reverse is fine. Throw if any illegal dependencies are found.
		const analyser = this.constructor as typeof Analyser
		const illegalDependencies = analyser.dependencies
			.map(dependency => typeof dependency === 'string' ? dependency : dependency.handle)
			.filter(handle => parser.container[handle] instanceof Module)
		if (illegalDependencies.length > 0) {
			throw new Error(`Analysers must never depend on legacy modules. Illegal dependencies found on ${analyser.handle}: ${illegalDependencies.join(', ')}.`)
		}
	}

	/**
	 * Called when the analyser has been successfully instantiated and configured,
	 * before any analysis is run. This is the recommended location to configure hooks.
	 */
	initialise() {}

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
		R extends FilterUnion<Event, ResolveType<F> & G>,
	>(
		filter: F | EventFilterPredicate<G>,
		callback: EventHookCallback<R>,
	): EventHook<R> {
		// Resolve the filter parameter down to a predicate function for use in the hook
		const resolvedType = typeof filter === 'string'
			? {type: filter}
			: filter

		const predicate = typeof resolvedType === 'function'
			? resolvedType as EventFilterPredicate<R>
			: buildFilterPredicate<R>(resolvedType as Partial<Event>)

		// Build & add the hook to the dispatcher
		const hook: EventHook<R> = {
			predicate,
			handle: (this.constructor as typeof Analyser).handle,
			callback,
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
}
