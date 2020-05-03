import Module, {dependency} from 'parser/core/Module'

export default class CastTime extends Module {
	static handle = 'castTime'

	@dependency data

	_castTimes = []
	_scIndex = null

	constructor(...args) {
		super(...args)

		// Only going to deal with SC here, job-specific can do it themselves
		const filter = {
			to: 'player',
			abilityId: this.data.statuses.SWIFTCAST.id,
		}
		this.addEventHook('applybuff', filter, this._onApplySwiftcast)
		this.addEventHook('removebuff', filter, this._onRemoveSwiftcast)
	}

	_onApplySwiftcast() {
		this._scIndex = this.set('all', 0)
	}

	_onRemoveSwiftcast() {
		this.reset(this._scIndex)
		this._scIndex = null
	}

	set(actions, castTime, start = this.parser.currentTimestamp, end = null) {
		const newLength = this._castTimes.push({
			actions,
			castTime,
			start,
			end,
		})

		return newLength - 1
	}

	reset(id, timestamp = this.parser.currentTimestamp) {
		const ct = this._castTimes[id]
		if (!ct) { return }
		ct.end = timestamp
	}

	forEvent(event) {
		return this.forAction(event.ability.guid, event.timestamp)
	}

	forAction(actionId, timestamp = this.parser.currentTimestamp) {
		// Get any cast time modifiers active when the event took place
		const matchingTimes = this._castTimes.filter(ct =>
			(ct.actions === 'all' || ct.actions.includes(actionId)) &&
			ct.start <= timestamp &&
			(ct.end === null || ct.end >= timestamp),
		)

		// Mimicking old logic w/ the undefined. Don't ask.
		const action = this.data.getAction(actionId)
		const defaultCastTime = action? action.castTime : undefined

		// If there were no modifiers, just use the default
		if (!matchingTimes.length) {
			return defaultCastTime
		}

		// Find the shortest cast time and assume that.
		// TODO: Is the above correct? SE probably has some seriously janky ass shit going on their end...
		return matchingTimes.reduce(
			(min, ct) => {
				// if ct.castTime is a negative number, reduce the default by that amount.
				// Don't let the result drop below 0
				const castTime = ct.castTime < 0 ? Math.max(0, min + ct.castTime) : ct.castTime
				return castTime < min ? castTime : min
			},
			defaultCastTime,
		)
	}
}
