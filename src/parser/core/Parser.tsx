import {mergeWith, sortBy} from 'lodash'
import Raven from 'raven-js'
import React from 'react'
import toposort from 'toposort'

import ErrorMessage from 'components/ui/ErrorMessage'
import {DependencyCascadeError} from 'errors'
import {Actor, Event, Fight, Pet, ReportFightsResponse} from 'fflogs'
import {extractErrorContext} from 'utilities'
import {Meta} from '.'
import Module, {MappedDependency} from './Module'

interface Player extends Actor {
	pets: Pet[]
}

interface LoadedMeta extends Meta {
	loadedModules: Array<typeof Module>
}

// TODO: This should probably be in the store, once the store gets ported
interface Report extends ReportFightsResponse {
	code: string
	loading: boolean
}

export interface Result {
	i18n_id?: string
	handle: string
	name: string
	markup: React.ReactNode
}

import ResultSegment from 'components/Analyse/ResultSegment'

/**
 * @typedef {{ i18n_id?: string; name: string; markup: React.ReactChild }} ParserResult
 */

class Parser {
	// -----
	// Properties
	// -----

	meta: Partial<LoadedMeta> = {}
	_timestamp = 0

	modules: Record<string, Module> = {}
	_constructors: Record<string, typeof Module> = {}

	moduleOrder: string[] = []
	_triggerModules: string[] = []
	_moduleErrors: Record<string, Error/* | {toString(): string } */> = {}

	_fabricationQueue: Event[] = []

	get currentTimestamp() {
		// TODO: this.finished?
		return Math.min(this.fight.end_time, this._timestamp)
	}

	get fightDuration() {
		// TODO: should i have like... currentDuration and fightDuration?
		//       this seems a bit jank
		return this.currentTimestamp - this.fight.start_time
	}

	// Get the friendlies that took part in the current fight
	get fightFriendlies() {
		return this.report.friendlies.filter(
			friend => friend.fights.some(fight => fight.id === this.fight.id),
		)
	}

	get parseDate() {
		// The report timestamp is relative to the report timestamp, and in ms. Convert.
		return Math.round((this.report.start + this.fight.start_time) / 1000)
	}

	// -----
	// Constructor
	// -----

	constructor(
		readonly report: Report,
		readonly fight: Fight,
		readonly player: Player,
	) {
		// Set initial timestamp
		this._timestamp = fight.start_time

		// Get a list of the current player's pets and set it on the player instance for easy reference
		player.pets = report.friendlyPets.filter(pet => pet.petOwner === player.id)
	}

	// -----
	// Module handling
	// -----

	addMeta(meta: LoadedMeta) {
		// Add the modules to the main system
		this.addModules(meta.loadedModules)

		// Merge the meta in
		mergeWith(this.meta, meta, (obj, src) => {
			if (Array.isArray(obj)) { return obj.concat(src) }
		})

		// Remove the modules key. I'm sure this could be done more nicely but I'm tired and on a bus rn.
		delete this.meta.modules
	}

	addModules(modules: Array<typeof Module>) {
		const keyed: Record<string, typeof Module> = {}

		modules.forEach(mod => {
			keyed[mod.handle] = mod
		})

		// Merge the modules into our constructor object
		Object.assign(this._constructors, keyed)
	}

	buildModules() {
		// Sort the changelog by the date
		this.meta.changelog = sortBy(this.meta.changelog, 'date')

		// Build the values we need for the toposort
		const nodes = Object.keys(this._constructors)
		const edges: Array<[string, string]> = []
		nodes.forEach(mod => this._constructors[mod].dependencies.forEach(dep => {
			edges.push([mod, this._getDepHandle(dep)])
		}))

		// Sort modules to load dependencies first
		// Reverse is required to switch it into depencency order instead of sequence
		// This will naturally throw an error on cyclic deps
		this.moduleOrder = toposort.array(nodes, edges).reverse()

		// Initialise the modules
		this.moduleOrder.forEach(mod => {
			this.modules[mod] = new this._constructors[mod](this)
		})
	}

	_getDepHandle = (dep: string | MappedDependency) => typeof dep === 'string'? dep : dep.handle

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
			this._timestamp = event.timestamp
			this.triggerEvent(event)
		}
	}

	*iterateEvents(events: Event[]) {
		const eventIterator = events[Symbol.iterator]()

		// Start the parse with an 'init' fab
		yield this.hydrateFabrication({type: 'init'})

		let obj
		// eslint-disable-next-line no-cond-assign
		while (!(obj = eventIterator.next()).done) {
			// Iterate over the actual event first
			yield obj.value

			// Iterate over any fabrications arising from the event and clear the queue
			yield* this._fabricationQueue
			this._fabricationQueue = []

		}

		// Finish with 'complete' fab
		yield this.hydrateFabrication({type: 'complete'})
	}

	hydrateFabrication(event: Partial<Event>): Event {
		// TODO: they've got a 'triggered' prop too...?
		return {
			// Provide default fields
			timestamp: this.currentTimestamp,
			type: 'fabrication',
			sourceID: -1,
			sourceIsFriendly: true,
			targetID: -1,
			targetInstance: -1,
			targetIsFriendly: true,

			// Fill out with any overwritten fields
			...event,
		}
	}

	fabricateEvent(event: Partial<Event>) {
		this._fabricationQueue.push(this.hydrateFabrication(event))
	}

	triggerEvent(event: Event) {
		// TODO: Do I need to keep a history?
		this._triggerModules.forEach(mod => {
			try {
				this.modules[mod].triggerEvent(event)
			} catch (error) {
				// If we're in dev, throw the error back up
				if (process.env.NODE_ENV === 'development') {
					throw error
				}

				// Error trying to handle an event, tell sentry
				// But first, gather some extra context
				const tags = {
					type: 'event',
					event: event.type.toString(),
					job: this.player && this.player.type,
					module: mod,
				}

				const extra: Record<string, any> = {
					report: this.report && this.report.code,
					fight: this.fight && this.fight.id,
					player: this.player && this.player.id,
					event,
				}

				// Gather extra data for the error report.
				const [data, errors] = this._gatherErrorContext(mod, 'event', error, event)
				extra.modules = data

				for (const [m, err] of errors) {
					Raven.captureException(err, {
						tags: {
							...tags,
							module: m,
						},
						extra,
					})
				}

				// Now that we have all the possible context, submit the
				// error to Raven.
				Raven.captureException(error, {
					tags,
					extra,
				})

				// Also cascade the error through the dependency tree
				this._setModuleError(mod, error)
			}
		})
	}

	_setModuleError(mod: string, error: Error) {
		// Set the error for the current module
		this._triggerModules.splice(this._triggerModules.indexOf(mod), 1)
		this._moduleErrors[mod] = error

		// Cascade via dependencies
		Object.keys(this._constructors).forEach(key => {
			const constructor = this._constructors[key]
			if (constructor.dependencies.some(dep => this._getDepHandle(dep) === mod)) {
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
	_gatherErrorContext(
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
					const handle = this._getDepHandle(dep)
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
				if (process.env.NODE_ENV === 'development') {
					throw error
				}

				// Error generating output for a module. Tell Sentry, but first,
				// gather some extra context

				const tags = {
					type: 'output',
					job: this.player && this.player.type,
					module: mod,
				}

				const extra: Record<string, any> = {
					report: this.report && this.report.code,
					fight: this.fight && this.fight.id,
					player: this.player && this.player.id,
				}

				// Gather extra data for the error report.
				const [data, errors] = this._gatherErrorContext(mod, 'output', error)
				extra.modules = data

				for (const [m, err] of errors) {
					Raven.captureException(err, {
						tags: {
							...tags,
							module: m,
						},
						extra,
					})
				}

				// Now that we have all the possible context, submit the
				// error to Raven.
				Raven.captureException(error, {
					tags,
					extra,
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
	// Utilities
	// -----

	byPlayer(event: Event, playerId = this.player.id) {
		return event.sourceID === playerId
	}

	toPlayer(event: Event, playerId = this.player.id) {
		return event.targetID === playerId
	}

	byPlayerPet(event: Event, playerId = this.player.id) {
		const pet = this.report.friendlyPets.find(pet => pet.id === event.sourceID)
		return pet && pet.petOwner === playerId
	}

	toPlayerPet(event: Event, playerId = this.player.id) {
		const pet = this.report.friendlyPets.find(pet => pet.id === event.targetID)
		return pet && pet.petOwner === playerId
	}

	formatTimestamp(timestamp: number, secondPrecision?: number) {
		return this.formatDuration(timestamp - this.fight.start_time, secondPrecision)
	}

	formatDuration(duration: number, secondPrecision?: number) {
		/* tslint:disable:no-magic-numbers */
		duration /= 1000
		const seconds = duration % 60
		if (duration < 60) {
			const precision = secondPrecision !== undefined? secondPrecision : seconds < 10? 2 : 0
			return seconds.toFixed(precision) + 's'
		}
		const precision = secondPrecision !== undefined ? secondPrecision : 0
		const secondsText = precision ? seconds.toFixed(precision) : '' + Math.floor(seconds)
		let pointPos = secondsText.indexOf('.')
		if (pointPos === -1) { pointPos = secondsText.length }
		return `${Math.floor(duration / 60)}:${pointPos === 1? '0' : ''}${secondsText}`
		/* tslint:enable:no-magic-numbers */
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
