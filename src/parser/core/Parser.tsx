import {MessageDescriptor} from '@lingui/core'
import * as Sentry from '@sentry/browser'
import ResultSegment from 'components/LegacyAnalyse/ResultSegment'
import ErrorMessage from 'components/ui/ErrorMessage'
import {languageToEdition} from 'data/EDITIONS'
import {getReportPatch, Patch} from 'data/PATCHES'
import {DependencyCascadeError, ModulesNotFoundError} from 'errors'
import {Event} from 'event'
import type {Actor as FflogsActor, Fight, Pet} from 'fflogs'
import type {Event as LegacyEvent} from 'legacyEvent'
import React from 'react'
import {Report, Pull, Actor} from 'report'
import {resolveActorId} from 'reportSources/legacyFflogs/base'
import {Report as LegacyReport} from 'store/report'
import toposort from 'toposort'
import {extractErrorContext, isDefined, formatDuration} from 'utilities'
import {Analyser, DisplayMode} from './Analyser'
import {Dispatcher} from './Dispatcher'
import {Injectable, MappedDependency} from './Injectable'
import {Meta} from './Meta'

interface Player extends FflogsActor {
	pets: Pet[]
}

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

	readonly report: LegacyReport
	readonly fight: Fight
	readonly player: Player
	readonly patch: Patch

	readonly newReport: Report
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
		const start = this.pull.timestamp
		const end = start + this.pull.duration
		return Math.min(end, Math.max(start, this.dispatcher.timestamp))
	}

	/**
	 * Get the current timestamp as per the legacy event system. Values are
	 * zeroed to the start of the legacy FF Logs report.
	 *
	 * If writing an Analyser for the new event system, you should use
	 * currentEpochTimestamp.
	 */
	get currentTimestamp() {
		return this.currentEpochTimestamp - this.report.start
	}

	get currentDuration() {
		return this.currentEpochTimestamp - this.pull.timestamp
	}

	// TODO: REMOVE
	get fightDuration() {
		if (process.env.NODE_ENV === 'development') {
			throw new Error('Please migrate your calls to `parser.fightDuration` to either `parser.pull.duration` (if you need the full pull duration) or `parser.currentDuration` if you need the zeroed current timestamp.')
		}
		return this.currentDuration
	}

	// Get the friendlies that took part in the current fight
	get fightFriendlies() {
		return this.report.friendlies.filter(
			friend => friend.fights.some(fight => fight.id === this.fight.id),
		)
	}

	get parseDate() {
		// TODO: normalise time to ms across the board
		return Math.round(this.pull.timestamp / 1000)
	}

	/** Offset for events to zero their timestamp to the start of the pull being analysed. */
	get eventTimeOffset() {
		// TODO: This is _wholly_ reliant on fflog's timestamp handling. Once everyone
		// is using this instead of start_time, we can start normalising event timestamps
		// at the source level.
		return this.pull.timestamp - this.newReport.timestamp
	}

	// -----
	// Constructor
	// -----

	constructor(opts: {
		meta: Meta,
		report: LegacyReport,
		fight: Fight,
		fflogsActor: FflogsActor,

		newReport: Report,
		pull: Pull,
		actor: Actor,

		dispatcher?: Dispatcher
	}) {
		this.dispatcher = opts.dispatcher ?? new Dispatcher()

		this.meta = opts.meta
		this.report = opts.report
		this.fight = opts.fight

		this.newReport = opts.newReport
		this.pull = opts.pull
		this.actor = opts.actor

		// Get a list of the current player's pets and set it on the player instance for easy reference
		const pets = opts.report.friendlyPets
			.filter(pet => pet.petOwner === opts.fflogsActor.id)

		this.player = {
			...opts.fflogsActor,
			pets,
		}

		this.patch = new Patch(
			languageToEdition(opts.report.lang),
			this.parseDate,
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
		this.executionOrder = toposort.array(nodes, edges).reverse()

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
				console.warn(`Attempted to queue an event in the past. Current timestamp: ${this.currentTimestamp}. Event: ${JSON.stringify(event)}`)
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
		if (getReportPatch(this.newReport).branch) {
			return
		}

		// Gather info for Sentry
		const tags = {
			type: opts.type,
			job: this.actor.job,
			module: opts.module,
		}

		const extra: Record<string, unknown> = {
			source: this.newReport.meta.source,
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

	byPlayer(event: {sourceID?: number}, playerId = this.player.id) {
		return event.sourceID === playerId
	}

	toPlayer(event: {targetID?: number}, playerId = this.player.id) {
		return event.targetID === playerId
	}

	byPlayerPet(event: {sourceID?: number}, playerId = this.player.id) {
		const pet = this.report.friendlyPets.find(pet => pet.id === event.sourceID)
		return pet && pet.petOwner === playerId
	}

	toPlayerPet(event: {targetID?: number}, playerId = this.player.id) {
		const pet = this.report.friendlyPets.find(pet => pet.id === event.targetID)
		return pet && pet.petOwner === playerId
	}

	/**
	 * Convert an fflogs event timestamp for the current pull to an epoch timestamp
	 * compatible with logic running in the new analysis system. Do ***not*** use this
	 * outside the above scenario.
	 * @deprecated
	 */
	fflogsToEpoch = (timestamp: number) =>
		timestamp - this.eventTimeOffset + this.pull.timestamp

	/**
	 * Convert a unix epoch timestamp to a report-relative timestamp compatible
	 * with logic running in the old analysis system. Do ***not*** use this
	 * outside the above scenario.
	 * @deprecated
	 */
	epochToFflogs = (timestamp: number) =>
		timestamp - this.pull.timestamp + this.eventTimeOffset

	/**
	 * Get an actor ID compatible with the new analysis system from the target of
	 * a legacy fflogs event. This should ***only*** be utilised in old modules that
	 * need to interop with the new system.
	 * @deprecated
	 */
	getFflogsEventSourceActorId = (event: LegacyEvent) =>
		resolveActorId({
			id: event.sourceID,
			instance: event.sourceInstance,
			actor: event.source,
		})

	/**
	 * Get an actor ID compatible with the new analysis system from the target of
	 * a legacy fflogs event. This should ***only*** be utilised in old modules that
	 * need to interop with the new system.
	 * @deprecated
	 */
	getFflogsEventTargetActorId = (event: LegacyEvent) =>
		resolveActorId({
			id: event.targetID,
			instance: event.targetInstance,
			actor: event.target,
		})

	formatTimestamp(timestamp: number, secondPrecision?: number) {
		return this.formatDuration(timestamp - this.fight.start_time, secondPrecision)
	}

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
