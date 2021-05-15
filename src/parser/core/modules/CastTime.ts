import {Event, Events} from 'event'
import {CastEvent} from 'fflogs'
import {Analyser} from '../Analyser'
import {filter} from '../filter'
import {dependency} from '../Injectable'
import {Data} from './Data'

export interface CastTimeAdjustment {
	actions: number[] | 'all',
	castTime: number,
	start: number,
	end: number | null
}

export default class CastTime extends Analyser {
	static handle = 'castTime'

	@dependency data!: Data

	private castTimes: CastTimeAdjustment[] = []
	private scIndex: number | null = null

	initialise() {
		// Only going to deal with SC here, job-specific can do it themselves
		const switftCastFilter = filter<Event>()
			.target(this.parser.actor.id)
			.status(this.data.statuses.SWIFTCAST.id)

		this.addEventHook(switftCastFilter.type('statusApply'), this.onApplySwiftcast)
		this.addEventHook(switftCastFilter.type('statusRemove'), this.onRemoveSwiftcast)
	}

	private onApplySwiftcast(): void {
		this.scIndex = this.set('all', 0)
	}

	private onRemoveSwiftcast(): void {
		this.reset(this.scIndex)
		this.scIndex = null
	}

	/** @deprecated */
	public setFflogs(actions: number[] | 'all', castTime: number, start: number = this.parser.currentTimestamp, end: number | null = null): number {
		return this.set(actions, castTime, this.parser.fflogsToEpoch(start), end ? this.parser.fflogsToEpoch(end) : null)
	}
	public set(actions: number[] | 'all', castTime: number, start: number = this.parser.currentEpochTimestamp, end: number | null = null): number {
		const newLength = this.castTimes.push({
			actions,
			castTime,
			start,
			end,
		})

		return newLength - 1
	}

	/** @deprecated */
	public resetFflogs(id: number | null, timestamp: number = this.parser.currentTimestamp): void {
		this.reset(id, this.parser.fflogsToEpoch(timestamp))
	}
	public reset(id: number | null, timestamp = this.parser.currentEpochTimestamp): void {
		if (id === null) { return }
		const ct = this.castTimes[id]
		if (!ct) { return }
		ct.end = timestamp
	}

	/** @deprecated */
	public forFflogsEvent(event: CastEvent): number | undefined {
		return this.forAction(event.ability.guid, this.parser.fflogsToEpoch(event.timestamp))
	}
	public forEvent(event: Events['action']): number | undefined {
		return this.forAction(event.action, event.timestamp)
	}

	/** @deprecated */
	public forFflogsAction(actionId: number, timestamp: number = this.parser.currentTimestamp): number | undefined {
		return this.forAction(actionId, this.parser.fflogsToEpoch(timestamp))
	}
	public forAction(actionId: number, timestamp: number = this.parser.currentEpochTimestamp): number | undefined {
		// Get any cast time modifiers active when the event took place
		const matchingTimes = this.castTimes.filter(ct =>
			(ct.actions === 'all' || ct.actions.includes(actionId)) &&
			ct.start <= timestamp &&
			(ct.end === null || ct.end >= timestamp),
		)

		// Mimicking old logic w/ the undefined. Don't ask.
		const action = this.data.getAction(actionId)
		const defaultCastTime = action ? action.castTime : undefined

		// If there were no modifiers, just use the default (or if the default comes back undefined, shouldn't happen but eh)
		if (!matchingTimes.length || defaultCastTime === undefined) {
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
