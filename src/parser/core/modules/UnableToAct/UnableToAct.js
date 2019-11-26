import Module from 'parser/core/Module'
import {STATUS_IDS} from './statusIds'

export default class UnableToAct extends Module {
	static handle = 'unableToAct'

	_downtimes = []
	_current = null

	constructor(...args) {
		super(...args)

		const filter = {abilityId: STATUS_IDS}
		this.addHook('applybuff', filter, this._onApply)
		this.addHook('applydebuff', filter, this._onApply)
		this.addHook('removebuff', filter, this._onRemove)
		this.addHook('removedebuff', filter, this._onRemove)

		this.addHook('complete', this._onComplete)
	}

	_onApply(event) {
		const downtime = this._current || {
			depth: 0,
			start: event.timestamp,
			end: null,
			applyEvents: [],
			removeEvents: [],
		}

		downtime.depth++
		downtime.applyEvents.push(event)
		this._current = downtime
	}

	_onRemove(event) {
		const downtime = this._current
		if (!downtime) { return }

		downtime.depth--
		downtime.removeEvents.push(event)

		if (downtime.depth <= 0) {
			downtime.end = event.timestamp
			this._downtimes.push(downtime)
			this._current = null
		}
	}

	_onComplete(event) {
		// If there's a current downtime, just force clear it
		if (!this._current) { return }
		for (let i = this._current.depth; i > 0; i--) {
			this._onRemove(event)
		}
	}

	getDowntimes(start = 0, end = this.parser.currentTimestamp) {
		return this._downtimes.filter(downtime => downtime.end > start && downtime.start < end)
	}
}
