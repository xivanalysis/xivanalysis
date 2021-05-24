import {Event, Events} from 'event'
import {CastEvent} from 'fflogs'
import {Analyser} from '../Analyser'
import {filter} from '../filter'
import {dependency} from '../Injectable'
import {Data} from './Data'

export interface CastTimeAdjustment {
	actions: number[] | 'all',
	type: 'time' | 'percentage'
	adjustment: number,
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
		this.scIndex = this.setInstantCastAdjustment()
	}

	private onRemoveSwiftcast(): void {
		this.reset(this.scIndex)
		this.scIndex = null
	}

	/**
	 * setTimeAdjustment Module-compatibility function
	 * @deprecated
	 */
	public setTimeAdjustmentFflogs(actions: number[] | 'all', adjustment: number, start: number = this.parser.currentTimestamp, end: number | null = null): number {
		return this.setTimeAdjustment(actions, adjustment, this.parser.fflogsToEpoch(start), end ? this.parser.fflogsToEpoch(end) : null)
	}
	/**
	 * Sets a cast time adjustment for a flat time amount per cast (See: Lightspeed, Dreadwyrm Trance, etc.)
	 * @param actions The actions this adjustment applies to. Either an array of IDs, or the string 'all'
	 * @param adjustment The amount of time that cast times are adjustmented by
	 * @param start The beginning of the adjustment time range. Defaults to the current epoch timestamp
	 * @param end The end of the adjustment time range. May be left null if the end of the range is not yet known
	 * @returns The index number within the cast time adjustments collection, can be used to reset/end this adjustment later
	 */
	public setTimeAdjustment(actions: number[] | 'all', adjustment: number, start: number = this.parser.currentEpochTimestamp, end: number | null = null): number {
		return this.set(actions, 'time', adjustment, start, end)
	}

	/**
	 * setInstantCastAdjustment Module-compatibility function
	 * @deprecated
	 */
	public setInstantCastAdjustmentFflogs(actions: number[] | 'all' = 'all', start: number = this.parser.currentTimestamp, end: number | null = null): number {
		return this.set(actions, 'percentage', 0, this.parser.fflogsToEpoch(start), end ? this.parser.fflogsToEpoch(end) : null)
	}
	/**
	 * Shorthand function for setting all casts to instant (ie. Swiftcast, Triplecast)
	 * @actions The actions this adjustment applies to. Either an array of IDs, or the string 'all'. Defaults to 'all'
	 * @param start
	 * @param end The beginning of the adjustment time range. Defaults to the current epoch timestamp
	 * @returns The end of the adjustment time range. May be left null if the end of the range is not yet known
	 */
	public setInstantCastAdjustment(actions: number[] | 'all' = 'all', start: number = this.parser.currentEpochTimestamp, end: number | null = null): number {
		return this.set(actions, 'percentage', 0, start, end)
	}
	/**
	 * setPercentageAdjustment Module-compatibility function
	 * @deprecated
	 */
	public setPercentageAdjustmentFflogs(actions: number[] | 'all', reduction: number, start: number = this.parser.currentTimestamp, end: number | null = null): number {
		return this.setPercentageAdjustment(actions, reduction, this.parser.fflogsToEpoch(start), end ? this.parser.fflogsToEpoch(end) : null)
	}
	/**
	 * Sets a cast time adjustment for a percentage change per cast (See: Swiftcast, RDM's Doublecast trait, Ley Lines, etc.)
	 * @param actions The actions this adjustment applies to. Either an array of IDs, or the string 'all'
	 * @param adjustment The percentage multiplier to adjust the cast time to (ie 0 for instant cast, 0.85 for Ley Lines, 1.25 for a 25% slow)
	 * @param start The beginning of the adjustment time range. Defaults to the current epoch timestamp
	 * @param end The end of the adjustment time range. May be left null if the end of the range is not yet known
	 * @returns The index number within the cast time adjustments collection, can be used to reset/end this adjustment later
	 */
	public setPercentageAdjustment(actions: number[] | 'all', adjustment: number, start: number = this.parser.currentEpochTimestamp, end: number | null = null): number {
		return this.set(actions, 'percentage', Math.max(adjustment, 0), start, end)
	}
	private set(actions: number[] | 'all', type: 'time' | 'percentage', adjustment: number, start: number = this.parser.currentEpochTimestamp, end: number | null = null): number {
		const newLength = this.castTimes.push({
			actions,
			type,
			adjustment,
			start,
			end,
		})

		return newLength - 1
	}

	/**
	 * reset Module-compatibility function
	 * @deprecated
	 */
	public resetFflogs(id: number | null, timestamp: number = this.parser.currentTimestamp): void {
		this.reset(id, this.parser.fflogsToEpoch(timestamp))
	}
	/**
	 * Sets the 'end' property of the specified cast time reduction range
	 * @param id The index within the cast times adjustment collection (provided by the set functions)
	 * @param timestamp The timestamp at which the reduction range ended. Defaults to the current epoch timestamp
	 */
	public reset(id: number | null, timestamp = this.parser.currentEpochTimestamp): void {
		if (id == null) { return }
		const ct = this.castTimes[id]
		if (!ct) { return }
		ct.end = timestamp
	}

	/**
	 * forEvent Module-compatibility function
	 * @deprecated
	 */
	public forFflogsEvent(event: CastEvent): number | undefined {
		return this.forAction(event.ability.guid, this.parser.fflogsToEpoch(event.timestamp))
	}
	/**
	 * Returns the effective cast time for the specified event
	 * @param event The event in question
	 * @returns The actual cast time, either as the default, or the modified time if any modifiers were in effect. Returns undefined if the action cannot be determined, or has no default cast time
	 */
	public forEvent(event: Events['action']): number | undefined {
		return this.forAction(event.action, event.timestamp)
	}

	/**
	 * forAction Module-compatibility function
	 * @deprecated
	 */
	public forFflogsAction(actionId: number, timestamp: number = this.parser.currentTimestamp): number | undefined {
		return this.forAction(actionId, this.parser.fflogsToEpoch(timestamp))
	}
	/**
	 * Returns the effective cast time for the specified action at the specified point in time
	 * @param actionId The action in question
	 * @param timestamp The timestamp in question
	 * @returns The actual cast time, either as the default, or the modified time if any modifiers were in effect. Returns undefined if the action cannot be determined, or has no default cast time
	 */
	public forAction(actionId: number, timestamp: number = this.parser.currentEpochTimestamp): number | undefined {
		// Get any cast time modifiers active when the event took place
		const matchingTimes = this.castTimes.filter(ct =>
			(ct.actions === 'all' || ct.actions.includes(actionId)) &&
			ct.start <= timestamp &&
			(ct.end == null || ct.end >= timestamp),
		)

		// Mimicking old logic w/ the undefined. Don't ask.
		const action = this.data.getAction(actionId)
		const defaultCastTime = action?.castTime

		// If there were no modifiers, just use the default (or if the default comes back undefined, shouldn't happen but eh)
		if (!matchingTimes.length || !defaultCastTime) {
			return defaultCastTime
		}

		// Find the largest flat cast time reduction value
		const flatReduction = matchingTimes.reduce(
			(reduction, ct) => {
				if (ct.type === 'percentage' || ct.adjustment > 0) { return reduction }
				if (ct.adjustment < reduction) { return ct.adjustment }
				return reduction
			}, 0)
		// Find the largest flat cast time increase value
		const flatIncrease = matchingTimes.reduce(
			(increase, ct) => {
				if (ct.type === 'percentage' || ct.adjustment < 0) { return increase }
				if (ct.adjustment > increase) { return ct.adjustment }
				return increase
			}, 0)
		// Get the total percentage adjustment
		const percentageAdjustment = matchingTimes.reduce(
			(adjustment, ct) => {
				if (ct.type === 'time') { return adjustment }
				return adjustment * ct.adjustment
			}, 1)
		// Calculate the final cast time based on the flat and percentage reductions we've found
		return Math.max(defaultCastTime + flatIncrease + flatReduction, 0) * percentageAdjustment // Yes, plus flatReduction because it's already a negative value

		/**
		 * In the absence of easily-acquired slows to test with, I'm going to assume this is the right way to calculate this:
		 * - Lightspeed/DWT even with slow should still have normal 2.5s casts be instant
		 * - Swiftcast/Triple/Dualcast with slow should still be instant
		 * Unsure what the actual interaction between slow and a non-instant percentage change like Ley Lines or a > 2.5s cast with Lightspeed/DWT (aka Raise) would be with a slow
		 * We're also not tracking any slow statuses so this is probably overkill but hey, maybe Reaper or Sage will have a slow-myself-down-to-hit-harder mechanic .-.
		 */
	}
}
