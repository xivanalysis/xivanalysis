import Module from 'parser/core/Module'

export default class AoE extends Module {
	static handle = 'aoe'

	// Track the current state per source (in case events get intermingled)
	_sources = {}

	on_cast(event) {
		const source = this._getSource(event)

		// If there's an ability already, fire off an event for the 'end' of the aoe
		if (source.ability && source.hits.length) {
			this._fireEvent(source)
		}

		// Reset the tracking
		source.castEvent = event
		source.ability = event.ability
		source.hits = []
	}

	on_damage(event) {
		// Not interested in recording ticks
		// Calling base impl of isValidHit - can be subclassed for fight specific handling
		if (event.tick || !this.isValidHit(event)) {
			return
		}

		// Record the hit
		this._getSource(event).hits.push({
			id: event.targetID,
			instance: event.targetInstance,
		})
	}

	on_complete() {
		// Do a round of cleanup on all the sources
		Object.values(this._sources).forEach(source => {
			if (!source.ability || !source.hits.length) { return }
			this._fireEvent(source)
		})
	}

	isValidHit(/* event */) {
		// Doesn't look like it's possible to derive invalid targets from fflog's api
		// Leaving that to boss modules instead
		return true
	}

	_getSource(event) {
		const id = event.sourceID
		return this._sources[id] = this._sources[id] || {
			id,
			castEvent: null,
			ability: null,
			hits: [],
		}
	}

	_fireEvent(source) {
		this.parser.fabricateEvent({
			type: 'aoedamage',
			...source,
			sourceID: source.id,
		})
	}
}
