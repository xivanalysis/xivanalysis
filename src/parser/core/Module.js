export const DISPLAY_ORDER = {
	ABOUT: -3,
	CHECKLIST: -2,
	SUGGESTIONS: -1,
	TOP: 0,
	DEFAULT: 50,
	BOTTOM: 100,
}

export default class Module {
	static dependencies = []
	static displayOrder = DISPLAY_ORDER.DEFAULT

	static _handle
	static get handle() {
		if (!this._handle) {
			const handle = this.name.charAt(0).toLowerCase() + this.name.slice(1)
			console.error(`\`${this.name}\` does not have an explicitly set handle. Using \`${handle}\`. This WILL break in minified builds.`)
			this._handle = handle
		}
		return this._handle
	}
	static set handle(value) {
		this._handle = value
	}

	static _title = null
	static get title() {
		if (!this._title) {
			this._title = this.handle.charAt(0).toUpperCase() + this.handle.slice(1)
		}
		return this._title
	}
	static set title(value) {
		this._title = value
	}

	_hooks = new Map()

	constructor(parser) {
		this.parser = parser
		this.constructor.dependencies.forEach(dep => {
			this[dep] = parser.modules[dep]
		})
	}

	normalise(events) {
		return events
	}


	/**
	 * This method is called when an error occurs, either when running
	 * event hooks or calling {@link Module#output} in this module or
	 * a module that depends on this module.
	 * @param {String} source Either 'event' or 'output'
	 * @param {Error} error The error that occurred
	 * @param {Object} event The event that was being processed when the error occurred, if source is 'event'
	 * @returns {Object|undefined} The data to attach to automatic error reports, or undefined to rely on primitive value detection
	 */
	getErrorContext(/* source, error, event */) {
		return
	}


	addHook(events, filter, cb) {
		const mapFilterEntity = (qol, raw) => {
			if (filter[qol]) {
				switch (filter[qol]) {
				case 'player':
					filter[raw] = this.parser.player.id
					break
				case 'pet':
					filter[raw] = this.parser.player.pets.map(pet => pet.id)
					break
				default:
					filter[raw] = filter[qol]
				}
				delete filter[qol]
			}
		}

		// I'm currently handling hooks at the module level
		// Should performance become a concern, this can be moved up to the Parser without breaking the API
		if (typeof filter === 'function') {
			cb = filter
			filter = {}
		}

		// QoL filter transforms
		mapFilterEntity('to', 'targetID')
		mapFilterEntity('by', 'sourceID')
		if (filter.abilityId) {
			if (!filter.ability) {
				filter.ability = {}
			}
			filter.ability.guid = filter.abilityId
			delete filter.abilityId
		}
		const hook = {
			events,
			filter,
			callback: cb.bind(this),
		}

		// Make sure events is an array
		if (!Array.isArray(events)) {
			events = [events]
		}

		// Hook for each of the events
		events.forEach(event => {
			// Make sure the map has a key for us
			if (!this._hooks.has(event)) {
				this._hooks.set(event, new Set())
			}

			// Set the hook
			this._hooks.get(event).add(hook)
		})

		// Return the hook representation so it can be removed (later)
		return hook
	}

	triggerEvent(event) {
		// Run through registered hooks. Avoid calling 'all' on symbols, they're internal stuff.
		if (typeof event.type !== 'symbol') {
			this._runHooks(event, this._hooks.get('all'))
		}
		this._runHooks(event, this._hooks.get(event.type))
	}

	_runHooks(event, hooks) {
		if (!hooks) { return }
		hooks.forEach(hook => {
			// Check the filter
			if (!this._filterMatches(event, hook.filter)) {
				return
			}

			hook.callback(event)
		})
	}

	_filterMatches(event, filter) {
		return Object.keys(filter).every(key => {
			// If the event doesn't have the key we're looking for, just shortcut out
			if (!event.hasOwnProperty(key)) {
				return false
			}

			const filterVal = filter[key]
			const eventVal = event[key]

			// FFLogs doesn't use arrays inside events themselves, so I'm using them to handle multiple possible values
			if (Array.isArray(filterVal)) {
				return filterVal.includes(eventVal)
			}

			// If it's an object, I need to dig down. Mostly for the `ability` key
			if (typeof filterVal === 'object') {
				return this._filterMatches(eventVal, filterVal)
			}

			// Basic value check
			return filterVal === eventVal
		})
	}

	output() {
		return false
	}
}
