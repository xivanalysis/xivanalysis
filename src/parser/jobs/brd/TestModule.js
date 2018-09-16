import Module from 'parser/core/Module'

export default class TestModule extends Module {
	static handle = 'testmodule'
	static dependencies = []

	_allEvents = []
	_damageEvents = []

	_lastTs = 0

	constructor(...args) {
		super(...args)

		this.addHook('init', () => console.log('START'))
		this.addHook('all', this._logAllEvents)
		this.addHook('damage', this._logDamageEvents)
		this.addHook('complete', this._onComplete)
	}

	_logAllEvents(event) {
		this._allEvents.push(event)

		const delta = event.timestamp - this._lastTs
		this._lastTs = event.timestamp

		if (delta < 0) {
			console.log('BACKTRACK', delta, event.timestamp)
		}
	}

	_logDamageEvents(event) {
		this._damageEvents.push(event)
	}

	_onComplete() {
		console.log('COMPLETE')
		console.log(this._allEvents)
		console.log(this._damageEvents)
	}
}
