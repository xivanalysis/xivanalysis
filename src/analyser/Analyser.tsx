import {MessageDescriptor} from '@lingui/core'
import {Actor, Event, Job} from '@xivanalysis/parser-core'
import ErrorMessage from 'components/ui/ErrorMessage'
import {GameEdition} from 'data/PATCHES'
import {DependencyCascadeError, ModulesNotFoundError} from 'errors'
import Raven from 'raven-js'
import React from 'react'
import toposort from 'toposort'
import {extractErrorContext, isDefined} from 'utilities'
import * as AVAILABLE_MODULES from './AVAILABLE_MODULES'
import {registerEvent} from './Events'
import {Meta} from './Meta'
import {DisplayMode, Handle, MappedDependency, Module} from './Module'
import {Patch} from './Patch'

/*
👏    NO    👏
👏  FFLOGS  👏
👏  IN THE  👏
👏 ANALYSER 👏
*/

export interface Result {
	handle: string
	name: string | MessageDescriptor
	mode: DisplayMode
	markup: React.ReactNode
}

export const EventTypes = {
	INIT: registerEvent({
		name: 'Analyser/INIT',
		formatter: () => 'Analysis has begun.',
	}),
	COMPLETE: registerEvent({
		name: 'Analyser/COMPLETE',
		formatter: () => 'Analysis has concluded.',
	}),
}

// TODO: should this be in the parser?
const isAddActor = (event: Event.Base): event is Event.AddActor =>
	event.type === Event.Type.ADD_ACTOR

const generateActorFinder = (id: Actor['id']) =>
	(event: Event.Base): event is Event.AddActor =>
		isAddActor(event) && event.actor.id === id

export class Analyser {
	/** The edition of the game that generated the events being analysed. */
	readonly gameEdition: GameEdition

	/** Representation of the patch at the time of logging */
	readonly patch: Patch

	/** The actor currently being analysed. */
	readonly actor: Actor

	/** Metadata about the modules that have been loaded. */
	readonly meta: Meta

	private readonly events: Event.Base[]
	private readonly zoneId: number

	private currentEventTimestamp: number

	/** Map of available modules. */
	private readonly modules = new Map<Handle, Module>()

	/** Module handles sorted per module loading order. */
	private moduleOrder: Handle[] = []

	private triggerModules: Handle[] = []
	private moduleErrors = new Map<Handle, Error>()

	private fabricationQueue: Event.Base[] = []

	/** Cached results */
	private results?: Result[]

	constructor(opts: {
		gameEdition: GameEdition,
		events: Event.Base[],
		actorId: Actor['id'],
		zoneId: number,
	}) {
		this.gameEdition = opts.gameEdition
		this.events = opts.events
		this.zoneId = opts.zoneId

		// Find the AddActor event for the provided actor
		// If they aren't added, we can't analyse them, so throw
		const event = opts.events.find(generateActorFinder(opts.actorId))
		if (!event) {
			throw new Error('Could not find actor matching the ID specified.')
		}
		this.actor = event.actor

		this.patch = new Patch(opts.gameEdition, this.startTime)

		// NOTE: Order of groups here is the order they will be loaded in. Later groups
		//       override earlier groups.
		const metas = [
			AVAILABLE_MODULES.CORE,
			AVAILABLE_MODULES.ZONES[this.zoneId],
			AVAILABLE_MODULES.JOBS[this.actor.job],
		]
		this.meta = metas
			.filter(isDefined)
			.reduce((acc, cur) => acc.merge(cur))

		this.currentEventTimestamp = this.startTime
	}

	// -----
	// #region Module loading / initialisation
	// -----

	/** Initialise the analyser. */
	async init() {
		const constructors = await this.loadModules(this.meta)
		this.buildModules(constructors)
	}

	private async loadModules(meta: Meta) {
		// Load in the modules
		// If this throws, then there was probably a deploy between page load and this call. Tell them to refresh.
		let allConstructors: ReadonlyArray<typeof Module>
		try {
			allConstructors = await meta.loadModules()
		} catch (error) {
			if (process.env.NODE_ENV === 'development') {
				throw error
			}
			throw new ModulesNotFoundError()
		}

		const constructors: Record<string, typeof Module> = {}
		allConstructors.flat().forEach(constructor => {
			constructors[constructor.handle] = constructor
		})

		return constructors
	}

	private buildModules(constructors: Record<string, typeof Module>) {
		// Build the values we need for the toposort
		const nodes = Object.keys(constructors)
		const edges: Array<[string, string]> = []
		nodes.forEach(mod => constructors[mod].dependencies.forEach(dep => {
			edges.push([mod, this.getDepHandle(dep)])
		}))

		// Sort modules to load dependencies first
		// Reverse is required to switch it into depencency order instead of sequence
		// This will naturally throw an error on cyclic deps
		this.moduleOrder = toposort.array(nodes, edges).reverse()

		// Initialise the modules
		this.moduleOrder.forEach(mod => {
			this.modules.set(mod, new constructors[mod]({
				analyser: this,
				modules: this.modules,
			}))
		})
	}

	private getDepHandle(dep: string | MappedDependency) {
		if (typeof dep === 'string') {
			return dep
		}

		return dep.handle
	}

	// -----
	// #endregion
	// -----

	// -----
	// #region Event handling
	// -----

	// TODO: Normalisation? idek

	async analyse() {
		// Wipe any cached results
		this.results = undefined

		// Copy of the module order we'll modify while analysing
		this.triggerModules = this.moduleOrder.slice()

		const events = await this.normalise(this.events)

		// Iterate over every event, inc. fabs, for each module
		for (const event of this.iterateEvents(events)) {
			this.currentEventTimestamp = event.timestamp

			this.triggerModules.forEach(handle => this.triggerEvent({
				handle,
				event,
			}))
		}
	}

	private async normalise(events: Event.Base[]) {
		// Run normalisers
		// This intentionally does not have error handling - modules may be relying on normalisers without even realising it. If something goes wrong, it could totally throw off results.
		for (const handle of this.moduleOrder) {
			const mod = this.modules.get(handle)
			if (!mod) { continue }
			events = await mod.normalise(events)
		}

		return events
	}

	private *iterateEvents(events: Event.Base[]): IterableIterator<Event.Base> {
		// Start the parse with an 'init' fab
		yield {
			timestamp: this.startTime,
			type: EventTypes.INIT,
		}

		for (const event of events) {
			// Iterate over the actual event first
			yield event

			// Iterate over any fabrications arising from the event and clear the queue
			if (this.fabricationQueue.length > 0) {
				yield* this.fabricationQueue
				this.fabricationQueue = []
			}
		}

		// Finish with 'complete' fab
		yield {
			timestamp: this.endTime,
			type: EventTypes.COMPLETE,
		}
	}

	private triggerEvent({handle, event}: {
		handle: Handle,
		event: Event.Base,
	}) {
		try {
			const module = this.modules.get(handle)
			if (!module) {
				throw new Error(`Tried to access undefined module ${handle}`)
			}
			module.triggerEvent(event)
		} catch (error) {
			// If we're in dev, throw the error back up
			if (process.env.NODE_ENV === 'development') {
				throw error
			}

			const {context, errors: additionalErrors} = this.gatherErrorContext({
				sourceHandle: handle,
				source: 'event',
				error,
				event,
			})
			this.reportErrors({
				error,
				tags: {
					type: 'event',
					event: Event.Type[event.type] || `Custom<${event.type}>`,
					job: Job[this.actor.job],
					module: handle,
				},
				extra: {modules: context, event},
				additionalErrors,
			})

			this.setModuleError({handle, error})
		}
	}

	private setModuleError({handle, error}: {
		handle: Handle,
		error: Error,
	}) {
		// Set the error for the module
		this.triggerModules.splice(this.triggerModules.indexOf(handle), 1)
		this.moduleErrors.set(handle, error)

		// Cascade the module through dependants
		this.triggerModules.slice().forEach(trigHandle => {
			const m = this.modules.get(trigHandle)
			if (!m) { return }

			const dependencies = (m.constructor as typeof Module).dependencies
			if (dependencies.some(dep => this.getDepHandle(dep) === handle)) {
				this.setModuleError({
					handle: trigHandle,
					error: new DependencyCascadeError({depencency: handle}),
				})
			}
		})
	}

	// -----
	// #endregion
	// -----

	// -----
	// #region Results handling
	// -----

	generateResults() {
		if (this.results) {
			return this.results
		}

		const displayOrder = this.moduleOrder.slice()

		const results = displayOrder
			.sort(this.moduleDisplaySortFn)
			.map(this.buildResult)
			.filter(isDefined)

		this.results = results

		return results
	}

	private moduleDisplaySortFn = (a: Handle, b: Handle) => {
		const aMod = this.modules.get(a)
		const bMod = this.modules.get(b)

		if (!aMod || !bMod) {
			return 0
		}

		const aCtor = (aMod.constructor as typeof Module)
		const bCtor = (bMod.constructor as typeof Module)

		return aCtor.displayOrder - bCtor.displayOrder
	}

	private buildResult = (handle: Handle): Result | undefined => {
		const module = this.modules.get(handle)
		if (!module) { return }

		const ctor = module.constructor as typeof Module

		const resultMeta = {
			name: ctor.title,
			handle,
			mode: ctor.displayMode,
		}

		// If the module errored, shortcut out with a render of the error
		const error = this.moduleErrors.get(handle)
		if (error) {
			return {
				...resultMeta,
				markup: <ErrorMessage error={error}/>,
			}
		}

		let output: React.ReactNode
		try {
			output = module.output()
		} catch (error) {
			if (process.env.NODE_ENV === 'development') {
				throw error
			}

			const {context, errors: additionalErrors} = this.gatherErrorContext({
				sourceHandle: handle,
				source: 'output',
				error,
			})
			this.reportErrors({
				error,
				tags: {type: 'output', job: Job[this.actor.job], module: handle},
				extra: {modules: context},
				additionalErrors,
			})

			return {
				...resultMeta,
				markup: <ErrorMessage error={error}/>,
			}
		}

		if (output !== null) {
			return {
				...resultMeta,
				markup: output,
			}
		}
	}

	// -----
	// #endregion
	// -----

	// -----
	// #region Error handling
	// -----

	private gatherErrorContext(opts: {
		sourceHandle: string,
		source: 'event' | 'output',
		error: Error,
		event?: Event.Base,
	}) {
		const context: Record<string, any> = {}
		const errors: Array<[string, Error]> = []
		const visited = new Set<string>()

		const crawler = (handle: string) => {
			visited.add(handle)

			const module = this.modules.get(handle)
			if (!module) { return }

			// Try to get error context from the module
			try {
				context[handle] = module.getErrorContext(opts.source, opts.error, opts.event)
			} catch (newError) {
				errors.push([handle, newError])
			}

			// Fall back to default context extraction
			if (context[handle] === undefined) {
				context[handle] = extractErrorContext(module)
			}

			// Crawl dependencies for further context
			const ctor = module.constructor as typeof Module
			for (const dep of ctor.dependencies) {
				const depHandle = this.getDepHandle(dep)
				if (visited.has(depHandle)) { continue }
				crawler(depHandle)
			}
		}

		crawler(opts.sourceHandle)
		return {context, errors}
	}

	private reportErrors(opts: {
		error: Error,
		tags: Record<string, string>,
		extra: Record<string, any>,
		additionalErrors: Array<[string, Error]>,
	}) {
		for (const [handle, error] of opts.additionalErrors) {
			Raven.captureException(error, {
				...opts,
				tags: {
					...opts.tags,
					module: handle,
				},
			})
		}

		Raven.captureException(opts.error, opts)
	}

	// -----
	// #endregion
	// -----

	// -----
	// #region Utilities
	// -----

	/** The timestamp of the start of the fight */
	get startTime() {
		return this.events[0].timestamp
	}

	/** The timestamp of the event currently being analysed */
	get currentTime() {
		return Math.min(this.endTime, this.currentEventTimestamp)
	}

	/** The timestamp of the end of the fight */
	get endTime() {
		return this.events[this.events.length - 1].timestamp
	}

	/** Translate a timestamp into ms relative to the start of the fight */
	relativeTimestamp(timestamp: number) {
		return timestamp - this.startTime
	}

	/** The duration of the entire fight */
	get fightDuration() {
		return this.relativeTimestamp(this.endTime)
	}

	/** Format the timestamp of an event, relative to the start of the fight */
	formatTimestamp(timestamp: number, secondPrecision?: number) {
		return this.formatDuration(this.relativeTimestamp(timestamp), secondPrecision)
	}

	/** Format a duration specified in ms as a human readable string */
	formatDuration(duration: number, secondPrecision: number = 2) {
		const floatSeconds = duration / 1000

		/* tslint:disable:no-magic-numbers */
		const m = Math.floor(floatSeconds / 60)
		const s = Math.floor(floatSeconds % 60).toString().padStart(2, '0')
		const ms = Math.round((floatSeconds % 1) * 10**secondPrecision).toString().padStart(secondPrecision, '0')
		/* tslint:enable:no-magic-numbers */

		return `${m}:${s}${secondPrecision > 0 && '.' + ms}`
	}

	// -----
	// #endregion
	// -----
}
