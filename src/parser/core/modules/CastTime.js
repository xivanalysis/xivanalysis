import { getAction } from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

export default class CastTime extends Module {
	_castTimes = []
	_scIndex = null

	on_applybuff_toPlayer(event) {
		// Only going do deal with SC here, job-specific can do it themselves
		if (event.ability.guid !== STATUSES.SWIFTCAST.id) { return }
		this._scIndex = this.setCastTime('all', 0)
	}

	on_removebuff_toPlayer(event) {
		if (event.ability.guid !== STATUSES.SWIFTCAST.id) { return }
		this.resetCastTime(this._scIndex)
		this._scIndex = null
	}

	setCastTime(actions, castTime, start = this.parser.currentTimestamp, end = null) {
		const newLength = this._castTimes.push({
			actions,
			castTime,
			start,
			end
		})

		return newLength - 1
	}

	resetCastTime(id, timestamp = this.parser.currentTimestamp) {
		this._castTimes[id].end = timestamp
	}

	forEvent(event) {
		const actionId = event.ability.guid

		// Get any cast time modifiers active when the event took place
		const matchingTimes = this._castTimes.filter(ct =>
			(ct.actions === 'all' || ct.actions.includes(actionId)) &&
			ct.start <= event.timestamp &&
			(ct.end === null || ct.end >= event.timestamp)
		)

		const defaultCastTime = getAction(actionId).castTime

		// If there were no modifiers, just use the default
		if (!matchingTimes.length) {
			return defaultCastTime
		}

		// Find the shortest cast time and assume that.
		// TODO: Is the above correct? SE probably has some seriously janky ass shit going on their end...
		return matchingTimes.reduce(
			(min, ct) => ct.castTime < min ? ct.castTime : min,
			defaultCastTime
		)
	}
}
