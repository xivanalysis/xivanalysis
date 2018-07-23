import Raven from 'raven-js'
import React from 'react'
import toposort from 'toposort'

import ErrorMessage from 'components/ui/ErrorMessage'
import {DependencyCascadeError} from 'errors'
import {extractErrorContext} from 'utilities'

class Parser {
	// -----
	// Properties
	// -----

	report = null
	fight = null
	player = null
	_timestamp = 0

	modules = {}
	_constructors = {}

	moduleOrder = []
	_triggerModules = []
	_moduleErrors = {}

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
			friend => friend.fights.some(fight => fight.id === this.fight.id)
		)
	}

	// -----
	// Constructor
	// -----

	constructor(report, fight, player) {
		this.report = report
		this.fight = fight
		this.player = player

		// Set initial timestamp
		this._timestamp = fight.start_time

		// Get a list of the current player's pets and set it on the player instance for easy reference
		player.pets = report.friendlyPets.filter(pet => pet.petOwner === player.id)
	}

	// -----
	// Module handling
	// -----

	addModules(modules) {
		const keyed = {}

		modules.forEach(mod => {
			keyed[mod.handle] = mod
		})

		// Merge the modules into our constructor object
		Object.assign(this._constructors, keyed)
	}

	buildModules() {
		// Build the values we need for the toposort
		const nodes = Object.keys(this._constructors)
		const edges = []
		nodes.forEach(mod => this._constructors[mod].dependencies.forEach(dep => {
			edges.push([mod, dep])
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

	// -----
	// Event handling
	// -----

	async normalise(events) {
		// Run normalisers
		// This intentionally does not have error handling - modules may be relying on normalisers without even realising it. If something goes wrong, it could totally throw off results.
		for (const mod of this.moduleOrder) {
			events = await this.modules[mod].normalise(events)
		}

		return events
	}

	parseEvents(events) {
		// Create a copy of the module order that we'll use while parsing
		this._triggerModules = this.moduleOrder.slice(0)

		this.fabricateEvent({type: 'init'})

		// Run the analysis pass
		events.forEach(event => {
			this._timestamp = event.timestamp
			this.triggerEvent(event)
		})

		this.fabricateEvent({type: 'complete'})
	}

	fabricateEvent(event, trigger) {
		// TODO: they've got a 'triggered' prop too...?
		this.triggerEvent({
			// Default to the current timestamp
			timestamp: this.currentTimestamp,
			trigger,
			// Rest of the event, mark it as fab'd
			...event,
			__fabricated: true,
		})
	}

	triggerEvent(event) {
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
					job: this.player && this.player.type,
					module: mod,
				}

				const extra = {
					report: this.report && this.report.code,
					fight: this.fight && this.fight.id,
					player: this.player && this.player.id,
					event,
				}

				// Try gathering extra data for the event from
				// the module with the error.
				let extraData = undefined

				if (typeof this.modules[mod].onError === 'function') {
					try {
						extraData = this.modules[mod].onError(error, event)
					} catch (errorTwo) {
						Raven.captureException(errorTwo, {
							tags,
							extra,
						})
					}
				}

				if (extraData === undefined) {
					extraData = extractErrorContext(this.modules[mod])
				}

				// Now that we have all the possible context, submit the
				// error to Raven.
				Raven.captureException(error, {
					tags,
					extra: {
						...extra,
						moduleData: extraData,
					},
				})

				// Also cascade the error through the dependency tree
				this._setModuleError(mod, error)
			}
		})
	}

	_setModuleError(mod, error) {
		// Set the error for the current module
		this._triggerModules.splice(this._triggerModules.indexOf(mod), 1)
		this._moduleErrors[mod] = error

		// Cascade via dependencies
		Object.keys(this._constructors).forEach(key => {
			const constructor = this._constructors[key]
			if (constructor.dependencies.includes(mod)) {
				this._setModuleError(key, new DependencyCascadeError({dependency: mod}))
			}
		})
	}

	// -----
	// Results handling
	// -----

	generateResults() {
		const displayOrder = this.moduleOrder
		displayOrder.sort((a, b) => this.modules[a].constructor.displayOrder - this.modules[b].constructor.displayOrder)

		const results = []
		displayOrder.forEach(mod => {
			const module = this.modules[mod]

			// If there's an error, override output handling to show it
			if (this._moduleErrors[mod]) {
				const error = this._moduleErrors[mod]
				results.push({
					name: module.constructor.title,
					markup: <ErrorMessage error={error} />,
				})
				return
			}

			// Use the ErrorMessage component for errors in the output too (and sentry)
			let output = null
			try {
				output = module.output()
			} catch (error) {
				if (process.env.NODE_ENV === 'development') {
					throw error
				}
				Raven.captureException(error)
				results.push({
					name: module.constructor.title,
					markup: <ErrorMessage error={error} />,
				})
				return
			}

			if (output) {
				results.push({
					name: module.constructor.title,
					markup: output,
				})
			}
		})

		return results
	}

	// -----
	// Utilities
	// -----

	byPlayer(event, playerId = this.player.id) {
		return event.sourceID === playerId
	}

	toPlayer(event, playerId = this.player.id) {
		return event.targetID === playerId
	}

	byPlayerPet(event, playerId = this.player.id) {
		const pet = this.report.friendlyPets.find(pet => pet.id === event.sourceID)
		return pet && pet.petOwner === playerId
	}

	toPlayerPet(event, playerId = this.player.id) {
		const pet = this.report.friendlyPets.find(pet => pet.id === event.targetID)
		return pet && pet.petOwner === playerId
	}

	formatTimestamp(timestamp, secondPrecision) {
		return this.formatDuration(timestamp - this.fight.start_time, secondPrecision)
	}

	formatDuration(duration, secondPrecision = null) {
		duration /= 1000
		const seconds = duration % 60
		if (duration < 60) {
			const precision = secondPrecision !== null? secondPrecision : seconds < 10? 2 : 0
			return seconds.toFixed(precision) + 's'
		}
		const precision = secondPrecision !== null ? secondPrecision : 0
		const secondsText = seconds.toFixed(precision)
		let pointPos = secondsText.indexOf('.')
		if (pointPos === -1) { pointPos = secondsText.length }
		return `${Math.floor(duration / 60)}:${pointPos === 1? '0' : ''}${secondsText}`
	}
}

export default Parser
