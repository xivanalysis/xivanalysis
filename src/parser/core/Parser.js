import toposort from 'toposort'

import About from './modules/About'
import AlwaysBeCasting from './modules/AlwaysBeCasting'
import CastTime from './modules/CastTime'
import Checklist from './modules/Checklist'
import Combatants from './modules/Combatants'
import Cooldowns from './modules/Cooldowns'
import Death from './modules/Death'
import Enemies from './modules/Enemies'
import GlobalCooldown from './modules/GlobalCooldown'
import Invulnerability from './modules/Invulnerability'
import Potions from './modules/Potions'
import PrecastStatus from './modules/PrecastStatus'
import Suggestions from './modules/Suggestions'
import Timeline from './modules/Timeline'
import Weaving from './modules/Weaving'

class Parser {
	// -----
	// Properties
	// -----

	static defaultModules = {
		about: About,
		abc: AlwaysBeCasting,
		castTime: CastTime,
		checklist: Checklist,
		combatants: Combatants,
		cooldowns: Cooldowns,
		death: Death,
		enemies: Enemies,
		gcd: GlobalCooldown,
		invuln: Invulnerability,
		potions: Potions,
		precastStatus: PrecastStatus,
		suggestions: Suggestions,
		timeline: Timeline,
		weaving: Weaving,
	}

	report = null
	fight = null
	player = null
	_timestamp = 0

	modules = {}
	_constructors = {}

	moduleOrder = []

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

		// Start off with the core modules
		this.addModules(this.constructor.defaultModules)
	}

	// -----
	// Module handling
	// -----

	addModules(modules) {
		// Merge the modules into our constructor object
		Object.assign(this._constructors, modules)
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
			const module = new this._constructors[mod]()
			module.constructor.dependencies.forEach(dep => {
				module[dep] = this.modules[dep]
			})
			module.parser = this
			this.modules[mod] = module
		})
	}

	// -----
	// Event handling
	// -----

	parseEvents(events) {
		// Run normalisers
		// TODO: This will need to be seperate if I start batching
		this.moduleOrder.forEach(mod => {
			events = this.modules[mod].normalise(events)
		})

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

		this.moduleOrder.forEach(mod => {
			this.modules[mod].triggerEvent(event)
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
			const output = module.output()

			if (output) {
				results.push({
					name: module.name,
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
		return `${Math.floor(duration / 60)}:${seconds < 10? '0' : ''}${seconds.toFixed(precision)}`

	}
}

export default Parser
