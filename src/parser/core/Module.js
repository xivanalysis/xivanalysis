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

	_name = null
	get name() {
		return this._name || ('DEV: ' + this.constructor.name)
	}
	set name(value) {
		this._name = value
	}

	normalise(events) {
		return events
	}

	triggerEvent(event) {
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

	output() {
		return false
	}

	_callMethod(methodName, ...args) {
		const method = this[methodName]
		if (method) {
			method.call(this, ...args)
		}
	}
}
