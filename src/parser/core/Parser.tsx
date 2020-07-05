import {MessageDescriptor} from '@lingui/core'
import * as Sentry from '@sentry/browser'
import ResultSegment from 'components/LegacyAnalyse/ResultSegment'
import ErrorMessage from 'components/ui/ErrorMessage'
import {getReportPatch, languageToEdition} from 'data/PATCHES'
import {DependencyCascadeError, ModulesNotFoundError} from 'errors'
import type {Event} from 'events'
import type {Actor as FflogsActor, Fight, Pet} from 'fflogs'
import React from 'react'
import {Report as LegacyReport} from 'store/report'
import toposort from 'toposort'
import {extractErrorContext} from 'utilities'
import {Dispatcher} from './Dispatcher'
import {Meta} from './Meta'
import Module, {DISPLAY_MODE, MappedDependency} from './Module'
import {Patch} from './Patch'
import {formatDuration} from 'utilities'
import {Report, Pull, Actor} from 'report'

interface Player extends FflogsActor {
	pets: Pet[]
}

export interface Result {
	i18n_id?: string
	handle: string
	name: string | MessageDescriptor
	mode: DISPLAY_MODE
	markup: React.ReactNode
}

export interface InitEvent {
	type: 'init'
	timestamp: number
}
export interface CompleteEvent {
	type: 'complete'
	timestamp: number
}

declare module 'events' {
	interface EventTypeRepository {
		parser: InitEvent | CompleteEvent
	}
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

	modules: Record<string, Module> = {}
	_constructors: Record<string, typeof Module> = {}

	moduleOrder: string[] = []
	_triggerModules: string[] = []
	_moduleErrors: Record<string, Error/* | {toString(): string } */> = {}

	_fabricationQueue: Event[] = []

	get currentTimestamp() {
		const start = this.eventTimeOffset
		const end = start + this.pull.duration
		return Math.min(end, Math.max(start, this.dispatcher.timestamp))
	}

	get currentDuration() {
		return this.currentTimestamp - this.eventTimeOffset
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

		dispatcher?: Dispatcher,
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
		const ctors = await this.loadModuleConstructors()

		// Build the values we need for the toposort
		const nodes = Object.keys(ctors)
		const edges: Array<[string, string]> = []
		nodes.forEach(mod => ctors[mod].dependencies.forEach(dep => {
			edges.push([mod, this.getDepHandle(dep)])
		}))

		// Sort modules to load dependencies first
		// Reverse is required to switch it into depencency order instead of sequence
		// This will naturally throw an error on cyclic deps
		this.moduleOrder = toposort.array(nodes, edges).reverse()

		// Initialise the modules
		this.moduleOrder.forEach(mod => {
			const ctdMod = new ctors[mod](this)
			this.modules[mod] = ctdMod
			ctdMod.doTheMagicInitDance()
		})
	}

	private async loadModuleConstructors() {
		// If this throws, then there was probably a deploy between page load and this call. Tell them to refresh.
		let allCtors: ReadonlyArray<typeof Module>
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
		const ctors: Record<string, typeof Module> = {}
		allCtors.forEach(ctor => {
			ctors[ctor.handle] = ctor
		})

		this._constructors = ctors
		return ctors
	}

	private getDepHandle = (dep: string | MappedDependency) =>
		typeof dep === 'string'
			? dep
			: dep.handle

	// -----
	// Event handling
	// -----

	async normalise(events: Event[]) {
		// Run normalisers
		// This intentionally does not have error handling - modules may be relying on normalisers without even realising it. If something goes wrong, it could totally throw off results.
		for (const mod of this.moduleOrder) {
			events = await this.modules[mod].normalise(events)
		}

		return events
	}

	parseEvents(events: Event[]) {
		// Create a copy of the module order that we'll use while parsing
		this._triggerModules = this.moduleOrder.slice(0)

		// Loop & trigger all the events & fabrications
		for (const event of this.iterateEvents(events)) {
			// TODO: Do I need to keep a history?
			const moduleErrors = this.dispatcher.dispatch(event, this._triggerModules)

			for (const handle in moduleErrors) {
				if (!moduleErrors.hasOwnProperty(handle)) { continue }
				const error = moduleErrors[handle]

				this.captureError({
					error,
					type: 'event',
					module: handle,
					event,
				})

				this._setModuleError(handle, error)
			}
		}
	}

	private *iterateEvents(events: Event[]): Generator<Event, void, undefined> {
		const eventIterator = events[Symbol.iterator]()

		// Start the parse with an 'init' fab
		yield {
			type: 'init',
			timestamp: this.fight.start_time,
		}

		let obj = eventIterator.next()
		while (!obj.done) {
			// Iterate over the actual event first
			yield obj.value
			obj = eventIterator.next()

			// Iterate over any fabrications arising from the event and clear the queue
			yield* this._fabricationQueue
			this._fabricationQueue = []
		}

		// Finish with 'complete' fab
		yield {
			type: 'complete',
			timestamp: this.fight.end_time,
		}
	}

	fabricateEvent(event: Event) {
		this._fabricationQueue.push(event)
	}

	private _setModuleError(mod: string, error: Error) {
		// Set the error for the current module
		const moduleIndex = this._triggerModules.indexOf(mod)
		if (moduleIndex !== -1 ) {
			this._triggerModules = this._triggerModules.slice(0)
			this._triggerModules.splice(moduleIndex, 1)
		}
		this._moduleErrors[mod] = error

		// Cascade via dependencies
		Object.keys(this._constructors).forEach(key => {
			const constructor = this._constructors[key]
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
		source: 'event' | 'output',
		error: Error,
		event?: Event,
	): [Record<string, any>, Array<[string, Error]>] {
		const output: Record<string, any> = {}
		const errors: Array<[string, Error]> = []
		const visited = new Set<string>()

		const crawler = (m: string) => {
			visited.add(m)

			const constructor = this._constructors[m]
			const module = this.modules[m]

			if (typeof module.getErrorContext === 'function') {
				try {
					output[m] = module.getErrorContext(source, error, event)
				} catch (error) {
					errors.push([m, error])
				}
			}

			if (output[m] === undefined) {
				output[m] = extractErrorContext(module)
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
		const displayOrder = [...this.moduleOrder]
		displayOrder.sort((a, b) => {
			const aConstructor = this.modules[a].constructor as typeof Module
			const bConstructor = this.modules[b].constructor as typeof Module
			return aConstructor.displayOrder - bConstructor.displayOrder
		})

		const results: Result[] = []
		displayOrder.forEach(mod => {
			const module = this.modules[mod]
			const constructor = module.constructor as typeof Module
			const resultMeta = {
				name: constructor.title,
				handle: constructor.handle,
				mode: constructor.displayMode,
				i18n_id: constructor.i18n_id,
			}

			// If there's an error, override output handling to show it
			if (this._moduleErrors[mod]) {
				const error = this._moduleErrors[mod]
				results.push({
					...resultMeta,
					markup: <ErrorMessage error={error} />,
				})
				return
			}

			// Use the ErrorMessage component for errors in the output too (and sentry)
			/** @type {import('./Module').ModuleOutput|null} */
			let output = null
			try {
				output = module.output()
			} catch (error) {
				this.captureError({
					error,
					type: 'output',
					module: mod,
				})

				// Also add the error to the results to be displayed.
				results.push({
					...resultMeta,
					markup: <ErrorMessage error={error} />,
				})
				return
			}

			if (output) {
				results.push({
					...resultMeta,
					markup: output,
				})
			}
		})

		return results
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

		const extra: Record<string, any> = {
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

	formatTimestamp(timestamp: number, secondPrecision?: number) {
		return this.formatDuration(timestamp - this.fight.start_time, secondPrecision)
	}

	formatDuration(duration: number, secondPrecision?: number) {
		return formatDuration(duration, {secondPrecision, hideMinutesIfZero: true, showNegative: true})
	}

	/**
	 * Scroll to the specified module
	 * @param handle - Handle of the module to scroll to
	 */
	scrollTo(handle: string) {
		const module = this.modules[handle]
		ResultSegment.scrollIntoView((module.constructor as typeof Module).handle)
	}
}

export default Parser
