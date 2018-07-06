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

	set name(value) {
		console.warn(`\`${this.constructor.handle}\` is setting the display title via the \`name\` instance property. Use \`static title\` instead.`)
		this.constructor.title = value
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

	addHook(event, filter, cb) {
		if (typeof filter === 'function') {
			cb = filter
			filter = {}
		}

		const hook = {
			event,
			filter,
			callback: cb,
		}

		// Make sure the map has a key for us
		if (!this._hooks.has(event)) {
			this._hooks.set(event, new Set())
		}

		// Set the hook and return it so it can be removed
		this._hooks.get(event).add(hook)
		return hook
	}

	triggerEvent(event) {
		// Run through hooks for all and this event
		this._runHooks(event, this._hooks.get('all'))
		this._runHooks(event, this._hooks.get(event.type))

		// Calling lots of events... if WoWA stops doing it maybe I will too :eyes:
		this._callMethod('on_event', event)
		this._callMethod(`on_${event.type}`, event)

		if (this.parser.byPlayer(event)) {
			this._callMethod(`on_${event.type}_byPlayer`, event)
		}
		if (this.parser.toPlayer(event)) {
			this._callMethod(`on_${event.type}_toPlayer`, event)
		}
		if (this.parser.byPlayerPet(event)) {
			this._callMethod(`on_${event.type}_byPlayerPet`, event)
		}
		if (this.parser.toPlayerPet(event)) {
			this._callMethod(`on_${event.type}_toPlayerPet`, event)
		}
	}

	_runHooks(event, hooks) {
		if (!hooks) { return }
		hooks.forEach(hook => {
			// Check the filter
			// TODO: Handle nested stuff like event.ability.guid
			if (!this._filterMatches(event, hook.filter)) {
				return
			}

			hook.callback(event)
		})
	}

	_filterMatches(event, filter) {
		return Object.keys(filter).every(key => {
			if (!event.hasOwnProperty(key)) {
				return false
			}
			if (typeof filter[key] === 'object') {
				return this._filterMatches(event[key], filter[key])
			}
			return filter[key] === event[key]
		})
	}

	output() {
		return false
	}

	_callMethod(methodName, ...args) {
		const method = this[methodName]
		if (method) {
			method.call(this, ...args)
		}
	}

	// on_init is basically the constructor, make sure people can call super on it
	on_init(/* event */) {}
}
