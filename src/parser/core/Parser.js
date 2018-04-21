import toposort from 'toposort'

import Combatant from './modules/Combatant'

class Parser {
	// -----
	// Properties
	// -----

	static defaultModules = {
		combatant: Combatant
	}
	static jobModules = {}

	report = null
	fight = null
	combatant = null

	modules = {}
	_timestamp = 0

	get currentTimestamp() {
		// TODO: this.finished?
		return Math.min(this.fight.end_time, this._timestamp)
	}

	// -----
	// Constructor w/ module dep resolution
	// -----

	constructor(report, fight, combatant) {
		this.report = report
		this.fight = fight
		this.combatant = combatant

		// Join the child modules in over the defaults
		const constructors = {
			...this.constructor.defaultModules,
			...this.constructor.jobModules
		}

		// Build the values we need for the topsort
		const nodes = Object.keys(constructors)
		const edges = []
		nodes.forEach(mod => constructors[mod].dependencies.forEach(dep => {
			edges.push([mod, dep])
		}))

		// Sort modules to load dependencies first
		// Reverse is required to switch it into depencency order instead of sequence
		// This will naturally throw an error on cyclic deps
		this.moduleOrder = toposort.array(nodes, edges).reverse()

		// Initialise the modules
		this.moduleOrder.forEach(mod => {
			const module = new constructors[mod]()
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
		events.forEach(event => {
			this.triggerEvent(event)
		})
	}

	fabricateEvent(event) {
		// TODO: they've got a 'triggered' prop too...?
		this.triggerEvent({
			// Default to the current timestamp
			timestamp: this.currentTimestamp,
			// Rest of the event, mark it as fab'd
			...event,
			__fabricated: true
		})
	}

	triggerEvent(event) {
		// TODO: Do I need to keep a history?

		this.moduleOrder.forEach(mod => {
			this.modules[mod].triggerEvent(event)
		})
	}

	// -----
	// Utilities
	// -----

	byPlayer(event, combatantId = this.combatant.id) {
		return event.sourceID === combatantId
	}

	toPlayer(event, combatantId = this.combatant.id) {
		return event.targetID === combatantId
	}
}

export default Parser
