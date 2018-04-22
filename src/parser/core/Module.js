class Module {
	static dependencies = []

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

		// TODO: Work these out
		// TODO: Probs should get pets working ey
		// if (this.owner && this.owner.byPlayerPet(event)) {
		//   this._callMethod(this._eventHandlerName(`byPlayerPet_${event.type}`), event);
		// }
		// if (this.owner && this.owner.toPlayerPet(event)) {
		//   this._callMethod(this._eventHandlerName(`toPlayerPet_${event.type}`), event);
		// }
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

export default Module
