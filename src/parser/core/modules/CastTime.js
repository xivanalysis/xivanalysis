import {getAction} from "data/ACTIONS"
import STATUSES from "data/STATUSES"
import Module from "parser/core/Module"

export default class CastTime extends Module {
	static handle = "castTime"

	_castTimes = []

	_scIndex = null

	constructor(...args) {
		super(...args);

		// Only going do deal with SC here, job-specific can do it themselves
		const filter = {
			to: "player",
			abilityId: STATUSES.SWIFTCAST.id,
		};
		this.addHook("applybuff", filter, this._onApplySwiftcast);
		this.addHook("removebuff", filter, this._onRemoveSwiftcast);
	}

	_onApplySwiftcast() {
		this._scIndex = this.set("all", 0);
	}

	_onRemoveSwiftcast() {
		this.reset(this._scIndex);
		this._scIndex = null;
	}

	set(actions, castTime, start = this.parser.currentTimestamp, end = null) {
		const newLength = this._castTimes.push({
			actions,
			castTime,
			start,
			end,
		});

		return newLength - 1;
	}

	reset(id, timestamp = this.parser.currentTimestamp) {
		this._castTimes[id].end = timestamp;
	}

	forEvent(event) {
		const actionId = event.ability.guid;

		// Get any cast time modifiers active when the event took place
		const matchingTimes = this._castTimes.filter(ct =>
			(ct.actions === "all" || ct.actions.includes(actionId)) &&
			ct.start <= event.timestamp &&
			(ct.end === null || ct.end >= event.timestamp)
		);

		const defaultCastTime = getAction(actionId).castTime;

		// If there were no modifiers, just use the default
		if (!matchingTimes.length) {
			return defaultCastTime;
		}

		// Find the shortest cast time and assume that.
		// TODO: Is the above correct? SE probably has some seriously janky ass shit going on their end...
		return matchingTimes.reduce(
			(min, ct) => ct.castTime < min ? ct.castTime : min,
			defaultCastTime
		);
	}
}
