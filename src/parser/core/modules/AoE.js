import Module from 'parser/core/Module'

export default class AoE extends Module {
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
		if (event.tick) {
			return
		}

		const source = this._getSource(event)

		// Record the hit
		source.hits.push({
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
