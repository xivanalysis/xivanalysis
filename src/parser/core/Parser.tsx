import {MessageDescriptor} from '@lingui/core'
import * as Sentry from '@sentry/browser'
import {ResultSegment} from 'components/ReportFlow/Analyse/ResultSegment'
import ErrorMessage from 'components/ui/ErrorMessage'
import {getReportPatch, Patch} from 'data/PATCHES'
import {DependencyCascadeError, ModulesNotFoundError} from 'errors'
import {Event} from 'event'
import React from 'react'
import {Report, Pull, Actor} from 'report'
import toposort from 'toposort'
import {extractErrorContext, isDefined, formatDuration} from 'utilities'
import {Analyser, DisplayMode} from './Analyser'
import {Dispatcher} from './Dispatcher'
import {Injectable, MappedDependency} from './Injectable'
import {Meta} from './Meta'

export interface Result {
	i18n_id?: string
	handle: string
	name: string | MessageDescriptor
	mode: DisplayMode
	order: number
	markup: React.ReactNode
}

declare module 'event' {
	interface EventTypeRepository {
		complete: FieldsBase,
	}
}

export interface InitEvent {
	type: 'init'
	timestamp: number
}
export interface CompleteEvent {
	type: 'complete'
	timestamp: number
}

class Parser {
	// -----
	// Properties
	// -----
	readonly dispatcher: Dispatcher

	readonly patch: Patch

	readonly report: Report
	readonly pull: Pull
	readonly actor: Actor

	readonly meta: Meta

	container: Record<string, Injectable> = {}

	private executionOrder: string[] = []
	_triggerModules: string[] = []
	_moduleErrors: Record<string, Error/* | {toString(): string } */> = {}

	// Stored soonest-last for performance
	private eventDispatchQueue: Event[] = []

	/** Get the unix epoch timestamp of the current state of the parser. */
	get currentEpochTimestamp() {
		return this.dispatcher.timestamp
	}

	get currentDuration() {
		return this.currentEpochTimestamp - this.pull.timestamp
	}

	// -----
	// Constructor
	// -----

	constructor(opts: {
		meta: Meta,

		report: Report,
		pull: Pull,
		actor: Actor,

		dispatcher?: Dispatcher
	}) {
		this.dispatcher = opts.dispatcher ?? new Dispatcher()

		this.meta = opts.meta

		this.report = opts.report
		this.pull = opts.pull
		this.actor = opts.actor

		this.patch = new Patch(
			opts.report.edition,
			this.pull.timestamp / 1000,
		)
	}

	// -----
	// Module handling
	// -----

	async configure() {
		const constructors = await this.loadModuleConstructors()

		// Build the values we need for the toposort
		const nodes = Object.keys(constructors)
		const edges: Array<[string, string]> = []
		nodes.forEach(mod => constructors[mod].dependencies.forEach(dep => {
			edges.push([mod, this.getDepHandle(dep)])
		}))

		// Sort modules to load dependencies first
		// Reverse is required to switch it into depencency order instead of sequence
		// This will naturally throw an error on cyclic deps
		try {
			this.executionOrder = toposort.array(nodes, edges).reverse()
		} catch (error) {
			if (!(error instanceof Error) || !error.message.includes('unknown node')) {
				throw error
			}

			// If we get an unknown node error; Work out _what_ nodes are unknown so the error is a bit more meaningful.
			const nodeSet = new Set(nodes)
			const unknown = edges
				.filter(([_source, target]) => !nodeSet.has(target))
				.map(([source, target]) => `${source}→${target}`)
			throw new Error(`Unregistered modules in dependency graph: ${unknown.join(', ')}`)
		}

		// Initialise the modules
		this.executionOrder.forEach(handle => {
			const injectable = new constructors[handle](this)
			this.container[handle] = injectable

			if (injectable instanceof Analyser) {
				injectable.initialise()
			} else {
				throw new Error(`Unhandled injectable type for initialisation: ${handle}`)
			}
		})
	}

	private async loadModuleConstructors() {
		// If this throws, then there was probably a deploy between page load and this call. Tell them to refresh.
		let allCtors: ReadonlyArray<typeof Injectable>
		try {
			allCtors = await this.meta.getModules()
		} catch (error) {
			if (process.env.NODE_ENV === 'development') {
				throw error
			}
			throw new ModulesNotFoundError()
		}

		// Build a final contructor mapping. Modules later in the list with
		// the same handle with override earlier ones.
		const ctors: Record<string, typeof Injectable> = {}
		allCtors.forEach(ctor => {
			ctors[ctor.handle] = ctor
		})

		return ctors
	}

	private getDepHandle = (dep: string | MappedDependency) =>
		typeof dep === 'string'
			? dep
			: dep.handle

	// -----
	// Event handling
	// -----

	parseEvents({events}: {events: Event[]}) {
		this._triggerModules = this.executionOrder.slice(0)

		for (const event of this.iterateXivaEvents(events)) {
			this.dispatchXivaEvent(event)
		}
	}

	private *iterateXivaEvents(events: Event[]): Iterable<Event> {
		const eventIterator = events[Symbol.iterator]()

		// Iterate the primary event source
		let result = eventIterator.next()
		while (!result.done) {
			const event = result.value

			// Check for, and yield, any queued events prior to the current timestamp
			// Using < rather than <= so that queued events execute after source events
			// of the same timestamp. Seems sane to me, but if it causes issue, change
			// the below to use <= instead - effectively weaving queue into source.
			const queue = this.eventDispatchQueue
			while (queue.length > 0 && queue[queue.length -1].timestamp < event.timestamp) {
				// Enforced by the while loop.
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				yield queue.pop()!
			}

			// Yield the source event and prep for next iteration
			yield event
			result = eventIterator.next()
		}

		// Mark the end of the pull with a completion event
		yield {
			type: 'complete',
			timestamp: this.pull.timestamp + this.pull.duration,
		}
	}

	private dispatchXivaEvent(event: Event) {
		const issues = this.dispatcher.dispatch(event, this._triggerModules)

		for (const {handle, error} of issues) {
			this.captureError({
				error,
				type: 'event',
				module: handle,
				event,
			})

			this._setModuleError(handle, error)
		}
	}

	queueEvent(event: Event) {
		// If the event is in the past, noop.
		if (event.timestamp < this.currentEpochTimestamp) {
			if (process.env.NODE_ENV === 'development') {
				console.warn(`Attempted to queue an event in the past. Current timestamp: ${this.currentEpochTimestamp}. Event: ${JSON.stringify(event)}`)
			}
			return
		}

		// TODO: This logic is 1:1 with timestamp hook queue. Abstract?
		const index = this.eventDispatchQueue.findIndex(
			queueEvent => queueEvent.timestamp < event.timestamp,
		)
		if (index === -1) {
			this.eventDispatchQueue.push(event)
		} else {
			this.eventDispatchQueue.splice(index, 0, event)
		}
	}

	private _setModuleError(mod: string, error: Error) {
		// Set the error for the current module
		const moduleIndex = this._triggerModules.indexOf(mod)
		if (moduleIndex !== -1) {
			this._triggerModules = this._triggerModules.slice(0)
			this._triggerModules.splice(moduleIndex, 1)
		}
		this._moduleErrors[mod] = error

		// Cascade via dependencies
		Object.keys(this.container).forEach(key => {
			const constructor = this.container[key].constructor as typeof Injectable
			if (constructor.dependencies.some(dep => this.getDepHandle(dep) === mod)) {
				this._setModuleError(key, new DependencyCascadeError({dependency: mod}))
			}
		})
	}

	/**
	 * Get error context for the named module and all of its dependencies.
	 * @param mod The name of the module with the faulting code
	 * @param source Either 'event' or 'output'
	 * @param error The error that we're gathering context for
	 * @param event The event that was being processed when the error occurred
	 * @returns The resulting data along with an object containing errors that were encountered running getErrorContext methods.
	 */
	private _gatherErrorContext(
		mod: string,
		_source: 'event' | 'output',
		_error: Error,
	): [Record<string, unknown>, Array<[string, Error]>] {
		const output: Record<string, unknown> = {}
		const errors: Array<[string, Error]> = []
		const visited = new Set<string>()

		const crawler = (handle: string) => {
			visited.add(handle)

			const injectable = this.container[handle]
			const constructor = injectable.constructor as typeof Injectable

			// TODO: Should Injectable also contain rudimentary error logic?

			if (output[handle] === undefined) {
				output[handle] = extractErrorContext(injectable)
			}

			if (constructor && Array.isArray(constructor.dependencies)) {
				for (const dep of constructor.dependencies) {
					const handle = this.getDepHandle(dep)
					if (!visited.has(handle)) {
						crawler(handle)
					}
				}
			}
		}

		crawler(mod)

		return [output, errors]
	}

	// -----
	// Results handling
	// -----

	generateResults() {
		const results: Result[] = this.executionOrder.map(handle => {
			const injectable = this.container[handle]
			const resultMeta = this.getResultMeta(injectable)

			// If there's an error, override output handling to show it
			if (this._moduleErrors[handle]) {
				const error = this._moduleErrors[handle]
				return {
					...resultMeta,
					markup: <ErrorMessage error={error} />,
				}
			}

			// Use the ErrorMessage component for errors in the output too (and sentry)
			let output: React.ReactNode = null
			try {
				output = this.getOutput(injectable)
			} catch (error) {
				this.captureError({
					error,
					type: 'output',
					module: handle,
				})

				// Also add the error to the results to be displayed.
				return {
					...resultMeta,
					markup: <ErrorMessage error={error} />,
				}
			}

			if (output) {
				return ({
					...resultMeta,
					markup: output,
				})
			}
		}).filter(isDefined)

		results.sort((a, b) => a.order - b.order)

		return results
	}

	private getResultMeta(injectable: Injectable): Result {
		if (injectable instanceof Analyser) {
			const constructor = injectable.constructor as typeof Analyser
			return {
				name: constructor.title,
				handle: constructor.handle,
				mode: constructor.displayMode,
				order: constructor.displayOrder,
				markup: null,
			}
		}

		const constructor = injectable.constructor as typeof Injectable
		throw new Error(`Unhandled injectable type for result meta: ${constructor.handle}`)
	}

	private getOutput(injectable: Injectable): React.ReactNode {
		if (injectable instanceof Analyser) {
			return injectable.output?.()
		}

		const constructor = injectable.constructor as typeof Injectable
		throw new Error(`Unhandled injectable type for output: ${constructor.handle}`)
	}

	// -----
	// Error handling
	// -----

	private captureError(opts: {
		error: Error,
		type: 'event' | 'output',
		module: string,
		event?: Event,
	}) {
		// Bypass error handling in dev
		if (process.env.NODE_ENV === 'development') {
			throw opts.error
		}

		// If the log should be analysed on a different branch, we'll probably be getting a bunch of errors - safe to ignore, as the logic will be fundamentally different.
		if (getReportPatch(this.report).branch) {
			return
		}

		// Gather info for Sentry
		const tags = {
			type: opts.type,
			job: this.actor.job,
			module: opts.module,
		}

		const extra: Record<string, unknown> = {
			source: this.report.meta.source,
			pull: this.pull.id,
			actor: this.actor.id,
			event: opts.event,
		}

		// Gather extra data for the error report.
		const [data, errors] = this._gatherErrorContext(opts.module, opts.type, opts.error)
		extra.modules = data

		for (const [m, err] of errors) {
			Sentry.withScope(scope => {
				scope.setTags({...tags, module: m})
				scope.setExtras(extra)
				Sentry.captureException(err)
			})
		}

		// Now that we have all the possible context, submit the
		// error to Sentry.
		Sentry.withScope(scope => {
			scope.setTags(tags)
			scope.setExtras(extra)
			Sentry.captureException(opts.error)
		})
	}

	// -----
	// Utilities
	// -----

	formatEpochTimestamp(timestamp: number, secondPrecision?: number) {
		return this.formatDuration(timestamp - this.pull.timestamp, secondPrecision)
	}

	formatDuration(duration: number, secondPrecision?: number) {
		return formatDuration(duration, {secondPrecision, hideMinutesIfZero: true, showNegative: true})
	}

	/**
	 * Scroll to the specified module
	 * @param handle - Handle of the module to scroll to
	 */
	scrollTo(handle: string) {
		const module = this.container[handle]
		ResultSegment.scrollIntoView((module.constructor as typeof Injectable).handle)
	}
}

export default Parser
